import os
import logging
from .models import CROReport, UserSettings, ChatMessage, UserToken
from agents import Agent, Runner, function_tool, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel
from rest_framework.response import Response
from rest_framework import status
import asyncio
import tempfile
import time
from typing import List, Optional, Dict, Any, Union


from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.db.models import F

# LiteLLM for flexible model support
import litellm


def clean_casual_language(text: str) -> str:
    """Remove casual language and unprofessional phrases from AI-generated reports"""
    if not text:
        return text

    # List of casual phrases to remove from the beginning
    casual_openings = [
        "OK. I have accessed the Google Analytics CSV data. Now I will analyze the data and create a comprehensive CRO audit report.\n\n## CRO Audit Report\n\n",
        "OK. I have accessed",
        "Okay, I have accessed",
        "OK I have accessed",
        "Okay I have accessed",
        "Let me analyze",
        "I'll analyze",
        "I will analyze",
        "Here's the",
        "Based on the analysis,",
        "Now I will",
        "I'll now",
    ]

    # Clean the opening
    for phrase in casual_openings:
        if text.startswith(phrase):
            text = text[len(phrase):]
            break

    # Remove casual phrases throughout the text
    casual_replacements = {
        "OK. ": "",
        "Okay, ": "",
        "Okay ": "",
        "I have ": "",
        "Let me ": "",
        "I'll ": "",
        "I will ": "",
        "Here's ": "This analysis presents ",
        "Let's ": "",
    }

    for old_phrase, new_phrase in casual_replacements.items():
        text = text.replace(old_phrase, new_phrase)

    # Clean up any duplicate whitespace or newlines at the start
    text = text.lstrip()

    # If the text doesn't start with a header, find the first meaningful content
    if not text.startswith(('#', '|', '**')):
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if line.strip() and (line.startswith('#') or line.startswith('|') or line.startswith('**')):
                text = '\n'.join(lines[i:])
                break

    return text


def get_api_key_for_provider(api_provider: str) -> tuple[str, str]:
    """Extract API key and model name for the given provider"""
    provider_parts = api_provider.split('/')
    model = api_provider

    # Gemini model name mapping for common names
    gemini_model_mapping = {
        "gemini-pro": "gemini-2.0-flash-exp",
        "gemini-2.0-flash": "gemini-2.0-flash-exp",
        "gemini-1.5-pro": "gemini-1.5-pro",
        "gemini-1.5-flash": "gemini-2.5-flash",
    }

    api_key = None

    # Handle single provider names without model specification
    if len(provider_parts) == 1:
        provider_name = provider_parts[0].lower()
        if provider_name == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
            model = "openai/gpt-4"  # Default OpenAI model
        elif provider_name in ["google", "gemini"]:
            api_key = os.environ.get("GOOGLE_API_KEY")
            model = "gemini/gemini-2.0-flash-exp-latest"  # Default Gemini model
        else:
            # Try to get API key based on common patterns
            api_key = os.environ.get(f"{provider_name.upper()}_API_KEY")

    # Handle provider/model format
    elif len(provider_parts) > 1:
        provider_name = provider_parts[0].lower()
        if provider_name == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
        elif provider_name in ["google", "gemini"]:
            api_key = os.environ.get("GOOGLE_API_KEY")
            model_name = provider_parts[-1]

            # Map deprecated or alternative model names
            if model_name in gemini_model_mapping:
                model_name = gemini_model_mapping[model_name]

            # Ensure proper model format
            model = f"gemini/{model_name}"
        else:
            # Try to get API key based on common patterns
            api_key = os.environ.get(f"{provider_name.upper()}_API_KEY")

    if not api_key:
        available_keys = []
        for key in os.environ:
            if key.endswith("_API_KEY"):
                available_keys.append(key)
        raise ValueError(f"API key not found for provider '{api_provider}'. Available environment variables: {available_keys}")

    return api_key, model


def categorize_csv_files(uploaded_files):
    """Categorize uploaded CSV files based on naming convention"""
    ga4_files = []
    shopify_files = []
    hotjar_files = []

    ga4_keywords = ["ga4", "googleanalytics", "google_analytics"]
    shopify_keywords = ["shopify"]
    hotjar_keywords = ["hotjar"]

    for uploaded_file in uploaded_files:
        file_name_lower = uploaded_file.name.lower()
        if any(keyword in file_name_lower for keyword in ga4_keywords):
            ga4_files.append(uploaded_file)
        elif any(keyword in file_name_lower for keyword in shopify_keywords):
            shopify_files.append(uploaded_file)
        elif any(keyword in file_name_lower for keyword in hotjar_keywords):
            hotjar_files.append(uploaded_file)
        else:
            # Default to GA4
            ga4_files.append(uploaded_file)

    return ga4_files, shopify_files, hotjar_files


def save_uploaded_files(uploaded_files, temp_dir):
    """Save uploaded files to temporary directory and return file paths"""
    file_paths = []
    for uploaded_file in uploaded_files:
        file_path = os.path.join(temp_dir, uploaded_file.name)
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        file_paths.append(file_path)
    return file_paths


async def ga4_function(user_token: str,user_model: str,user_key: str,csv_files_list: List[str]) -> str:
    """Analyze Google Analytics 4 data from CSV files using OpenAI Agent SDK and LiteLLM"""
    try:
        import pandas as pd
        from agents import Agent, Runner, function_tool, set_tracing_disabled
        from agents.extensions.models.litellm_model import LitellmModel
    except ImportError:
        return "Error: Required libraries not installed. Please run 'pip install \"openai-agents[litellm]\" pandas'"

    # Load and process CSV files
    try:
        dataframes = []
        for csv_file in csv_files_list:
            df = pd.read_csv(csv_file)
            file_name = os.path.basename(csv_file)
            dataframes.append((file_name, df))

        if not dataframes:
            return "Error: No valid CSV files were provided or all files failed to load."
    except Exception as csv_error:
        return f"Error loading CSV files: {str(csv_error)}"

    # Define the function tool to provide CSV data to the agent
    @function_tool
    def get_csv_data() -> str:
        """Get the contents and analysis of the Google Analytics CSV files"""
        csv_content = ""
        for file_name, df in dataframes:
            csv_content += f"### CSV File: {file_name}\n"
            csv_content += f"Columns: {', '.join(df.columns)}\n"
            csv_content += f"Total rows: {len(df)}\n"
            csv_content += f"Data:\n{df.to_string(max_rows=50)}\n\n"
        return csv_content

    # Extract API key and model for the provider using user_token
    # try:
    #     api_key, model = get_api_key_for_provider(user_token)
    # except ValueError as e:
    #     return f"Error: {str(e)}"

    # Create the agent with instructions
    set_tracing_disabled(disabled=True)
    agent = Agent(
        name="GA4 Analyzer",
        instructions=(
            """
            You are a senior Google Analytics specialist conducting a comprehensive conversion rate optimization audit.

            CRITICAL REQUIREMENTS:
            - Call get_csv_data() function to access Google Analytics CSV data
            - Extract and analyze only metrics explicitly present in the data
            - Use professional business language throughout
            - Begin directly with the KPIs section - no introductory statements
            - Do NOT use casual phrases like "OK", "Okay", "I have", or "Let me"

            PROFESSIONAL OUTPUT STRUCTURE:

            ## 0. Performance Dashboard - Key Metrics

            | Metric | Value | Source |
            |--------|--------|--------|
            | Sessions | [from data] | Google Analytics 4 |
            | Conversion Rate | [from data] | Google Analytics 4 |
            | Bounce Rate | [from data] | Google Analytics 4 |

            ## 1. Traffic Acquisition Analysis
            - Traffic sources performance and quality assessment
            - Geographic distribution and conversion patterns
            - Device and browser performance analysis
            - User behavior flow analysis

            ## 2. Conversion Funnel Assessment
            - Entry and exit point analysis
            - Bounce rate evaluation by segment
            - User path optimization opportunities
            - Conversion drop-off identification

            ## 3. User Engagement Analysis
            - Session duration and depth metrics
            - Content performance evaluation
            - Page-level engagement assessment

            ## 4. Technical Implementation Review
            - Goal configuration and tracking accuracy
            - E-commerce tracking performance
            - Event tracking completeness
            - Audience segmentation insights

            ## 5. Strategic Recommendations
            - Traffic quality optimization opportunities
            - Landing page improvement priorities
            - Conversion funnel enhancements
            - User experience optimization initiatives

            ## 6. Implementation Roadmap
            - Immediate optimization opportunities
            - Medium-term strategic initiatives
            - Long-term growth strategies

            EXECUTION: Call get_csv_data() first, then create a professional analysis without casual language.
            """
        ),
        model=LitellmModel(model=user_model, api_key=user_key),
        tools=[get_csv_data],
    )

    try:
        prompt = (
            "Generate a professional Google Analytics conversion optimization audit. Call get_csv_data() "
            "to access the CSV files, then create a comprehensive business-grade analysis using formal "
            "language. Begin directly with the Performance Dashboard section. Extract real metrics from "
            "the data and present strategic recommendations with professional formatting."
        )
        result = await Runner.run(agent, prompt)

        # Clean up casual language using comprehensive function
        return clean_casual_language(result.final_output)
    except Exception as e:
        return f"Error processing with AI agent: {str(e)}"


async def hotjar_function(user_token: str,user_model: str,user_key: str,csv_files_list: List[str]) -> str:
    """Analyze Hotjar data from CSV files using OpenAI Agent SDK and LiteLLM"""
    try:
        import pandas as pd
        from agents import Agent, Runner, function_tool, set_tracing_disabled
        from agents.extensions.models.litellm_model import LitellmModel
    except ImportError:
        return "Error: Required libraries not installed. Please run 'pip install \"openai-agents[litellm]\" pandas'"

    # Load and process CSV files
    try:
        dataframes = []
        for csv_file in csv_files_list:
            df = pd.read_csv(csv_file)
            file_name = os.path.basename(csv_file)
            dataframes.append((file_name, df))

        if not dataframes:
            return "Error: No valid CSV files were provided or all files failed to load."
    except Exception as csv_error:
        return f"Error loading CSV files: {str(csv_error)}"

    # Define the function tool to provide CSV data to the agent
    @function_tool
    def get_csv_data() -> str:
        """Get the contents and analysis of the Hotjar CSV files"""
        csv_content = ""
        for file_name, df in dataframes:
            csv_content += f"### CSV File: {file_name}\n"
            csv_content += f"Columns: {', '.join(df.columns)}\n"
            csv_content += f"Total rows: {len(df)}\n"
            csv_content += f"Data:\n{df.to_string(max_rows=50)}\n\n"
        return csv_content

    # Extract API key and model for the provider using user_token
    # try:
    #     api_key, model = get_api_key_for_provider(user_token)
    # except ValueError as e:
    #     return f"Error: {str(e)}"

    # Create the agent with instructions
    set_tracing_disabled(disabled=True)
    agent = Agent(
        name="Hotjar Analyzer",
        instructions=(
            """
            You are a senior user experience analyst specializing in behavioral data analysis and conversion optimization.

            CRITICAL REQUIREMENTS:
            - Call get_csv_data() function to access Hotjar behavioral data
            - Extract metrics only from the actual CSV data provided
            - Use professional business language throughout
            - Begin directly with the User Experience Dashboard - no introductory statements
            - Do NOT use casual phrases like "OK", "Okay", "I have", or "Let me"

            PROFESSIONAL OUTPUT STRUCTURE:

            ## 0. User Experience Dashboard - Behavioral Metrics

            | Metric | Value | Source |
            |--------|--------|--------|
            | Primary Interaction Element | [from data] | Hotjar Heatmap Analysis |
            | Top Click Engagement Rate | [from data] | Hotjar Click Tracking |
            | Critical UX Friction Point | [from data] | Hotjar Behavioral Analysis |

            ## 1. User Interaction Analysis
            - Click pattern assessment and heatmap insights
            - Scroll behavior and content engagement depth
            - User journey flow evaluation
            - Session behavior pattern analysis

            ## 2. Conversion Barrier Identification
            - Primary friction points in user experience
            - Navigation and interface usability issues
            - Content accessibility and interaction problems

            ## 3. Page Performance Assessment
            - Element interaction efficiency
            - User engagement quality indicators
            - Interface responsiveness evaluation

            ## 4. Behavioral Analytics Insights
            - Platform-specific behavioral metrics
            - User engagement pattern analysis
            - Interaction success rate evaluation

            ## 5. User Experience Optimization Strategy
            - Interface improvement recommendations
            - Navigation enhancement opportunities
            - Content optimization priorities

            ## 6. Implementation Action Plan
            - Critical UX fixes requiring immediate attention
            - Strategic interface improvements
            - Long-term user experience enhancements

            EXECUTION: Call get_csv_data() first, then create a professional behavioral analysis without casual language.
            """
        ),
        model=LitellmModel(model=user_model, api_key=user_key),

        tools=[get_csv_data],
    )

    try:
        prompt = (
            "Generate a professional user experience audit based on Hotjar behavioral data. Call get_csv_data() "
            "to access the CSV files, then create a comprehensive business-grade analysis using formal "
            "language. Begin directly with the User Experience Dashboard section. Extract real behavioral "
            "metrics and present strategic UX recommendations with professional formatting."
        )
        result = await Runner.run(agent, prompt)

        # Clean up casual language using comprehensive function
        return clean_casual_language(result.final_output)
    except Exception as e:
        return f"Error processing with AI agent: {str(e)}"


async def shopify_function(user_token: str,user_model: str,user_key: str,csv_files_list: List[str]) -> str:
    """Analyze Shopify data from CSV files using OpenAI Agent SDK and LiteLLM"""
    try:
        import pandas as pd
        from agents import Agent, Runner, function_tool, set_tracing_disabled
        from agents.extensions.models.litellm_model import LitellmModel
    except ImportError:
        return "Error: Required libraries not installed. Please run 'pip install \"openai-agents[litellm]\" pandas'"

    # Load and process CSV files
    try:
        dataframes = []
        for csv_file in csv_files_list:
            df = pd.read_csv(csv_file)
            file_name = os.path.basename(csv_file)
            dataframes.append((file_name, df))

        if not dataframes:
            return "Error: No valid CSV files were provided or all files failed to load."
    except Exception as csv_error:
        return f"Error loading CSV files: {str(csv_error)}"

    # Define the function tool to provide CSV data to the agent
    @function_tool
    def get_csv_data() -> str:
        """Get the contents and analysis of the Shopify CSV files"""
        metrics = ""
        for file_name, df in dataframes:
            metrics += f"### CSV File: {file_name}\n"
            metrics += f"Columns: {', '.join(df.columns)}\n"
            metrics += f"Total rows: {len(df)}\n"
            metrics += f"Data:\n{df.to_string(max_rows=50)}\n\n"
        return metrics

    # # Extract API key and model for the provider using user_token
    # try:
    #     api_key, model = get_api_key_for_provider(user_token)
    # except ValueError as e:
    #     return f"Error: {str(e)}"

    # Create the agent with instructions
    set_tracing_disabled(disabled=True)
    agent = Agent(
        name="Shopify Analyzer",
        instructions=(
            """
            You are a senior e-commerce analyst specializing in Shopify platform optimization and revenue analysis.

            CRITICAL REQUIREMENTS:
            - Call get_csv_data() function to access Shopify e-commerce data
            - Extract metrics only from the actual CSV data provided
            - Use professional business language throughout
            - Begin directly with the E-commerce Performance Dashboard - no introductory statements
            - Do NOT use casual phrases like "OK", "Okay", "I have", or "Let me"

            PROFESSIONAL OUTPUT STRUCTURE:

            ## 0. E-commerce Performance Dashboard

            | Metric | Value | Source |
            |--------|--------|--------|
            | Total Revenue | [from data] | Shopify Analytics |
            | Average Order Value | [from data] | Shopify Analytics |
            | Total Orders | [from data] | Shopify Analytics |
            | Conversion Rate | [from data] | Shopify Analytics |

            ## 1. Executive Performance Summary
            Revenue performance overview with key metrics and growth indicators

            ## 2. Customer Acquisition Analysis
            Marketing channel performance and acquisition cost effectiveness

            ## 3. Customer Behavior Intelligence
            Purchase patterns, product preferences, and engagement analytics

            ## 4. Financial Performance Analysis
            Revenue streams, profitability metrics, and financial health indicators

            ## 5. Order Management Assessment
            Fulfillment efficiency, processing metrics, and operational performance

            ## 6. Inventory Optimization Analysis
            Stock performance, turnover rates, and inventory management insights

            ## 7. Sales Performance Trends
            Revenue patterns, seasonal variations, and growth trajectory analysis

            ## 8. Risk Management Analysis
            Fraud detection insights and security performance evaluation

            ## 9. Revenue Optimization Strategy
            Data-driven recommendations for conversion rate and revenue improvement

            FORMATTING REQUIREMENTS:
            - Professional business language only
            - Clear section headers with markdown formatting
            - For missing data, state exactly: "Not available"
            - Present currency as numbers without symbols unless present in source data

            EXECUTION: Call get_csv_data() first, then create a professional e-commerce analysis without casual language.
            """
        ),
        model=LitellmModel(model=user_model, api_key=user_key),
        tools=[get_csv_data],
    )

    try:
        prompt = (
            "Generate a professional e-commerce performance audit based on Shopify data. Call get_csv_data() "
            "to access the CSV files, then create a comprehensive business-grade analysis using formal "
            "language. Begin directly with the E-commerce Performance Dashboard section. Extract real "
            "revenue metrics and present strategic optimization recommendations with professional formatting."
        )
        result = await Runner.run(agent, prompt)

        # Clean up casual language using comprehensive function
        return clean_casual_language(result.final_output)
    except Exception as e:
        return f"Error processing with AI agent: {str(e)}"


async def comprehensive_cro_audit(user_token: str,user_model: str,user_key: str, responses: dict) -> str:
    """Generate a comprehensive CRO audit report by combining the analysis from GA4, Hotjar, and Shopify data."""
    try:
        from agents import Agent, Runner, function_tool, set_tracing_disabled
        from agents.extensions.models.litellm_model import LitellmModel
    except ImportError:
        return "Error: Required libraries not installed. Please run 'pip install \"openai-agents[litellm]\" pandas'"

    # Define the function tool to provide combined data to the agent
    @function_tool
    def get_combined_data() -> str:
        """Get the combined analysis from GA4, Hotjar, and Shopify data"""
        combined_content = ""

        # Debug: Log what data we have
        print(f"DEBUG: Responses keys: {list(responses.keys()) if responses else 'None'}")

        if 'ga4' in responses and responses['ga4']:
            if not responses['ga4'].startswith("Error"):
                combined_content += "## Google Analytics 4 Report\n\n"
                combined_content += responses['ga4'] + "\n\n"
                print("DEBUG: Added GA4 data")
            else:
                print(f"DEBUG: GA4 has error: {responses['ga4'][:100]}...")

        if 'hotjar' in responses and responses['hotjar']:
            if not responses['hotjar'].startswith("Error"):
                combined_content += "## Hotjar User Behavior Report\n\n"
                combined_content += responses['hotjar'] + "\n\n"
                print("DEBUG: Added Hotjar data")
            else:
                print(f"DEBUG: Hotjar has error: {responses['hotjar'][:100]}...")

        if 'shopify' in responses and responses['shopify']:
            if not responses['shopify'].startswith("Error"):
                combined_content += "## Shopify E-commerce Report\n\n"
                combined_content += responses['shopify'] + "\n\n"
                print("DEBUG: Added Shopify data")
            else:
                print(f"DEBUG: Shopify has error: {responses['shopify'][:100]}...")

        print(f"DEBUG: Combined content length: {len(combined_content)}")

        if not combined_content:
            return "No valid data available from individual reports. All reports contain errors or are empty."

        return combined_content

    # Extract API key and model for the provider
    # try:
    #     api_key, model = get_api_key_for_provider(api_provider)
    # except ValueError as e:
    #     return f"Error: {str(e)}"

    # Check if we have any data to work with
    if not responses or not any(responses.values()):
        return "No data available for comprehensive analysis."

    # Create the agent with instructions
    set_tracing_disabled(disabled=True)
    agent = Agent(
        name="CRO Audit Specialist",
        instructions=(
            """
            You are a senior CRO consultant generating a comprehensive conversion optimization audit report.

            CRITICAL REQUIREMENTS:
            - You will receive pre-analyzed reports from Google Analytics 4, Hotjar, and Shopify
            - Extract and synthesize data from these reports into a unified professional audit
            - Use ONLY metrics explicitly stated in the provided reports
            - Present findings in a formal, business-professional tone
            - Do NOT use casual language like "Okay" or conversational phrases
            - Begin directly with the KPIs section - no introductory statements

            PROFESSIONAL OUTPUT STRUCTURE:

            ## 0. Executive Dashboard - Key Performance Indicators

            | Metric | Value | Source |
            |--------|-------|--------|
            | Total Revenue | [from Shopify data] | Shopify Analytics |
            | Average Order Value | [from Shopify data] | Shopify Analytics |
            | Total Orders | [from Shopify data] | Shopify Analytics |
            | Overall Conversion Rate | [from GA4 data] | Google Analytics 4 |
            | Primary Traffic Source | [from GA4 data] | Google Analytics 4 |
            | Mobile vs Desktop Performance | [from GA4 data] | Google Analytics 4 |

            ## 1. Executive Summary
            - Performance overview with quantified metrics
            - Critical optimization opportunities identified
            - Projected business impact with data-driven estimates

            ## 2. Technical Analytics Assessment
            - Traffic acquisition and quality analysis (GA4 insights)
            - User behavior and interaction patterns (Hotjar insights)
            - E-commerce performance metrics (Shopify insights)
            - Conversion funnel performance analysis

            ## 3. Strategic Recommendations
            Priority-ranked optimization opportunities:
            - High-impact traffic optimization initiatives
            - User experience improvements based on behavior data
            - Product catalog and sales process enhancements
            - Revenue optimization strategies

            ## 4. 30-Day Implementation Roadmap
            Week-by-week actionable tasks with:
            - Specific implementation steps
            - Resource requirements
            - Expected timeline
            - Success metrics

            ## 5. Projected Business Impact
            Quantified projections based on current performance baseline.

            EXECUTION: First call get_combined_data() to access the individual reports, then create a professional synthesis without casual language or placeholder content.
            """
        ),
        model=LitellmModel(model=user_model, api_key=user_key),
        tools=[get_combined_data],
    )

    try:
        # Professional prompt for comprehensive analysis
        prompt = (
            "Generate a comprehensive conversion rate optimization audit report by synthesizing the "
            "individual Google Analytics 4, Hotjar, and Shopify analysis reports. Call get_combined_data() "
            "to access the pre-analyzed reports, then create a professional business-grade CRO audit. "
            "Use formal business language, extract real metrics from the provided reports, and present "
            "actionable recommendations with quantified impact projections. Begin directly with the KPIs section."
        )
        result = await Runner.run(agent, prompt)

        # Clean up casual language using comprehensive function
        return clean_casual_language(result.final_output)
    except Exception as e:
        return f"Error processing with AI agent: {str(e)}"


# Synchronous wrapper functions for Django views
def ga4_function_sync(api_provider: str, csv_files_list: List[str]) -> str:
    """Synchronous wrapper for the GA4 analysis function"""
    return asyncio.run(ga4_function(api_provider, csv_files_list))


def hotjar_function_sync(api_provider: str, csv_files_list: List[str]) -> str:
    """Synchronous wrapper for the Hotjar analysis function"""
    return asyncio.run(hotjar_function(api_provider, csv_files_list))


def shopify_function_sync(api_provider: str, csv_files_list: List[str]) -> str:
    """Synchronous wrapper for the Shopify analysis function"""
    return asyncio.run(shopify_function(api_provider, csv_files_list))


def comprehensive_cro_audit_sync(api_provider: str, responses: dict) -> str:
    """Synchronous wrapper for the comprehensive CRO audit function"""
    return asyncio.run(comprehensive_cro_audit(api_provider, responses))


@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def chat_with_assistant(request):
    """
    API endpoint for chatting with an AI assistant using user-specific settings.

    Request JSON:
    {
        'question': str,       # Required
        'chat_id': Optional[str],   # Optional - for chat thread management
        'report_id': Optional[int]  # Optional - to provide report context
        'user_token': str  # Required - to provide user_token
    }
    """
    import uuid
    try:
        user = None
        question = request.data.get('question')
        chat_id = request.data.get('chat_id')
        report_id = request.data.get('report_id', None)
        user_token = request.data.get('user_token')
        if not user_token:
            return Response(
                {'error': 'user_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not question:
            return Response(
                {'error': 'Question is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user_token:
            user_t = UserToken.objects.get(token=user_token)
            user = user_t.user

        # Generate a new chat_id if not provided
        if not chat_id:
            chat_id = str(uuid.uuid4())

        # Fetch the CROReport if report_id is given
        cro_report = None
        if report_id:
            try:
                cro_report = CROReport.objects.get(id=report_id, user=user)
            except CROReport.DoesNotExist:
                return Response(
                    {'error': 'Report not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Save user's question message
        ChatMessage.objects.create(
            user=user,
            chat_id=chat_id,
            report=cro_report,
            sender='user',
            message=question
        )

        # Generate AI response using the updated helper
        response_text = generate_chat_response(
            user=user,
            user_question=question,
            report_id=report_id
        )

        # Save assistant's response message
        ChatMessage.objects.create(
            user=user,
            chat_id=chat_id,
            report=cro_report,
            sender='assistant',
            message=response_text
        )

        return Response({
            'response': response_text,
            'chat_id': chat_id
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def get_chat_history(request):
    """
    API endpoint to get chat history by user_token and chat_id.

    Request JSON:
    {
        "user_token": str,
        "chat_id": str
    }
    """
    user_token = request.data.get('user_token')
    chat_id = request.data.get('chat_id')

    if not user_token or not chat_id:
        return Response({'error': 'user_token and chat_id are required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = validate_user_token(user_token)
    if not user:
        return Response({'error': 'Invalid user_token'}, status=status.HTTP_401_UNAUTHORIZED)

    messages = ChatMessage.objects.filter(user=user, chat_id=chat_id).order_by('timestamp')

    serialized = [{
        'sender': msg.sender,
        'message': msg.message,
        'timestamp': msg.timestamp.isoformat()
    } for msg in messages]

    return Response({'chat_id': chat_id, 'messages': serialized}, status=status.HTTP_200_OK)


@api_view(['POST'])
def get_chat_threads_with_messages(request):
    """
    API endpoint to get all chat threads for a user.
    If a specific chat_id is provided, also returns chat messages for that thread.

    Request JSON:
    {
        "user_token": str,          # Required
        "chat_id": str              # Optional - if provided, returns messages for this chat
    }

    Response JSON:
    {
        "threads": [                # List of chat threads
            {
                "chat_id": str,
                "thread_name": str,
                "last_message": str,
                "last_updated": timestamp,
                "message_count": int
            }
        ],
        "messages": [               # Only included if chat_id is provided
            {
                "sender": str,
                "message": str,
                "timestamp": timestamp
            }
        ]
    }
    """
    user_token = request.data.get('user_token')
    chat_id = request.data.get('chat_id')  # Optional

    if not user_token:
        return Response({'error': 'user_token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    user = validate_user_token(user_token)
    if not user:
        return Response({'error': 'Invalid user_token'}, status=status.HTTP_401_UNAUTHORIZED)

    # Get list of all chat threads for this user with last message and count
    from django.db.models import Max, Count

    threads_data = ChatMessage.objects.filter(user=user) \
        .values('chat_id') \
        .annotate(
            last_updated=Max('timestamp'),
            message_count=Count('id')
        ) \
        .order_by('-last_updated')

    threads = []
    for thread in threads_data:
        # Get the last message for each thread
        last_message = ChatMessage.objects.filter(
            user=user,
            chat_id=thread['chat_id']
        ).order_by('-timestamp').first()

        # Create a readable thread name (could be customized)
        thread_name = f"Chat Thread {thread['chat_id'][:8]}"

        threads.append({
            'chat_id': thread['chat_id'],
            'thread_name': thread_name,
            'last_message': last_message.message[:100] + '...' if len(last_message.message) > 100 else last_message.message,
            'last_updated': thread['last_updated'].isoformat(),
            'message_count': thread['message_count']
        })

    # Prepare response data
    response_data = {
        'threads': threads
    }

    # If a specific chat_id is provided, include the messages for that chat
    if chat_id:
        # Check if chat exists and belongs to user
        chat_exists = any(thread['chat_id'] == chat_id for thread in threads)

        if not chat_exists:
            return Response({'error': 'Chat thread not found or does not belong to user'},
                           status=status.HTTP_404_NOT_FOUND)

        # Fetch messages for the specified chat
        messages = ChatMessage.objects.filter(user=user, chat_id=chat_id).order_by('timestamp')

        serialized_messages = [{
            'sender': msg.sender,
            'message': msg.message,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages]

        response_data['messages'] = serialized_messages
        response_data['current_chat_id'] = chat_id

    return Response(response_data, status=status.HTTP_200_OK)


def validate_user_token(user_token: str):
    """Validate user token and return user instance or None."""
    from rest_framework.authtoken.models import Token
    try:
        token = UserToken.objects.get(token=user_token)
        return token.user
    except Token.DoesNotExist:
        return None

from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['POST'])
@csrf_exempt
# @permission_classes([IsAuthenticated])
def generate_cro_audit_report(request):
    """API endpoint to generate comprehensive CRO audit report from uploaded CSV files"""
    print("Generating CRO audit report...")
    try:
        # Get access token from request data instead of relying on request.user
        access_token = request.data.get('accessToken')
        user_settings = None
        if access_token:
            from rest_framework.authtoken.models import Token
            try:
                token_obj = Token.objects.get(key=access_token)
                user = token_obj.user
                user_settings = UserSettings.objects.get(user=user)
            except (Token.DoesNotExist, UserSettings.DoesNotExist):
                user_settings = None

        print(request.FILES)
        print(request.data)
        # Determine api_provider from user settings or fallback to request or default
        if user_settings:
            api_provider = user_settings.ai_model or 'openai/gpt-4'
        else:
            api_provider = request.data.get('api_provider', 'openai/gpt-4')
        uploaded_files = request.FILES.getlist('csv_files')
        print(uploaded_files)
        if not uploaded_files:
            return Response(
                {'error': 'No CSV files uploaded'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Only support OpenAI and Gemini models
        if not any(provider in api_provider.lower() for provider in ['openai', 'gemini', 'google']):
            return Response(
                {'error': 'Only OpenAI and Gemini models are supported'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create CRO report instance with associated user from token if available
        start_time = time.time()
        cro_report = CROReport.objects.create(
            user=user if user_settings else request.user,
            api_provider=api_provider,
            status='processing'
        )

        try:
            # Categorize files based on naming convention
            ga4_files, shopify_files, hotjar_files = categorize_csv_files(uploaded_files)

            # Store file information
            file_info = {
                'ga4_files': [f.name for f in ga4_files],
                'shopify_files': [f.name for f in shopify_files],
                'hotjar_files': [f.name for f in hotjar_files],
                'total_files': len(uploaded_files)
            }
            cro_report.uploaded_files_info = file_info
            cro_report.save()

            # Create temporary directory for processing files
            with tempfile.TemporaryDirectory() as temp_dir:
                # Save files and get paths
                ga4_paths = save_uploaded_files(ga4_files, temp_dir) if ga4_files else []
                shopify_paths = save_uploaded_files(shopify_files, temp_dir) if shopify_files else []
                hotjar_paths = save_uploaded_files(hotjar_files, temp_dir) if hotjar_files else []

                # Process individual reports
                responses = {}

                # Generate GA4 report
                if ga4_paths:
                    ga4_report = ga4_function_sync(api_provider, ga4_paths)
                    responses['ga4'] = ga4_report
                    cro_report.ga4_report = ga4_report

                # Generate Shopify report
                if shopify_paths:
                    shopify_report = shopify_function_sync(api_provider, shopify_paths)
                    responses['shopify'] = shopify_report
                    cro_report.shopify_report = shopify_report

                # Generate Hotjar report
                if hotjar_paths:
                    hotjar_report = hotjar_function_sync(api_provider, hotjar_paths)
                    responses['hotjar'] = hotjar_report
                    cro_report.hotjar_report = hotjar_report

                # Generate comprehensive report if we have any individual reports
                print(f"DEBUG: About to generate comprehensive report with responses: {list(responses.keys()) if responses else 'None'}")
                if responses:
                    # Check if we have any successful reports (not just errors)
                    valid_reports = {}
                    for key, value in responses.items():
                        if value and not value.startswith("Error"):
                            valid_reports[key] = value

                    print(f"DEBUG: Valid reports for comprehensive analysis: {list(valid_reports.keys())}")

                    if valid_reports:
                        comprehensive_report = comprehensive_cro_audit_sync(api_provider, responses)
                        cro_report.comprehensive_report = comprehensive_report
                    else:
                        cro_report.comprehensive_report = "All individual reports contain errors. Please check your data files and try again."
                else:
                    cro_report.comprehensive_report = "No valid data sources were provided for analysis."

                # Update report status and processing time
                end_time = time.time()
                cro_report.processing_time_seconds = end_time - start_time
                cro_report.status = 'completed'
                cro_report.save()

                # Prepare response
                response_data = {
                    'report_id': cro_report.id,
                    'status': 'completed',
                    'processing_time': cro_report.processing_time_seconds,
                    'file_info': file_info,
                    'completion_percentage': cro_report.completion_percentage,
                    'comprehensive_report': cro_report.comprehensive_report,
                    'individual_reports': {
                        'ga4_report': cro_report.ga4_report,
                        'shopify_report': cro_report.shopify_report,
                        'hotjar_report': cro_report.hotjar_report,
                    }
                }

                return Response({'response': response_data}, status=status.HTTP_200_OK)



        except Exception as processing_error:
            # Update report with error information
            cro_report.status = 'failed'
            cro_report.error_message = str(processing_error)
            cro_report.processing_time_seconds = time.time() - start_time
            cro_report.save()

            return Response(
                {
                    'report_id': cro_report.id,
                    'status': 'failed',
                    'error': f'Processing failed: {str(processing_error)}'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except Exception as e:
        return Response(
            {'error': f'Request failed: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
def get_cro_report(request):
    """
    API endpoint to retrieve a specific CRO report or CSV file for download,
    or delete a report or CSV file when is_delete is true

    Request Parameters:
    - report_id: ID of the report
    - user_token: User authentication token
    - report_type: Type of report to retrieve ('comprehensive', 'ga4', 'shopify', 'hotjar', 'csv')
    - report_name: Required for CSV files to identify which CSV to return
    - is_delete: If true, deletes the report or CSV file instead of retrieving it

    Response:
    - Returns the requested report content or file information for download
    - Or confirmation of deletion when is_delete is true
    """
    try:
        # Get required parameters
        report_id = request.data.get('report_id')
        user_token = request.data.get('user_token')
        report_type = request.data.get('report_type', 'comprehensive')  # Default to comprehensive
        report_name = request.data.get('report_name')  # Required for CSV file retrieval
        is_delete = request.data.get('is_delete', False)  # Default is retrieval, not deletion
        print("Hello World I am Here",report_id)
        # Validate parameters
        if not report_id:
            return Response({'error': 'report_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not user_token:
            return Response({'error': 'user_token is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Authenticate user with token
        try:
            user_token_obj = UserToken.objects.get(token=user_token)
            user = user_token_obj.user
        except UserToken.DoesNotExist:
            return Response({'error': 'Invalid user_token'}, status=status.HTTP_401_UNAUTHORIZED)

        # Get the report
        cro_report = CROReport.objects.get(id=report_id, user=user)
        print("Hello World I am Here",cro_report)
        # Handle deletion if is_delete is True
        if is_delete:
            if report_type == 'csv':
                # Validate report_name for CSV deletion
                print("Hello World I am Here")
                if not report_name:
                    return Response(
                        {'error': 'report_name is required for CSV deletion'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Look for the CSV in uploaded_files_info and remove it
                if cro_report.uploaded_files_info:
                    file_found = False
                    for file_type in ['ga4_files', 'shopify_files', 'hotjar_files']:
                        if file_type in cro_report.uploaded_files_info and report_name in cro_report.uploaded_files_info[file_type]:
                            cro_report.uploaded_files_info[file_type].remove(report_name)
                            file_found = True
                            break

                    if file_found:
                        # Update total_files count
                        if 'total_files' in cro_report.uploaded_files_info:
                            cro_report.uploaded_files_info['total_files'] = max(0, cro_report.uploaded_files_info['total_files'] - 1)
                        cro_report.save()
                        return Response(
                            {'success': f'CSV file "{report_name}" has been deleted from the report'},
                            status=status.HTTP_200_OK
                        )
                    else:
                        return Response(
                            {'error': f'CSV file "{report_name}" not found in the report'},
                            status=status.HTTP_404_NOT_FOUND
                        )
                else:
                    return Response(
                        {'error': 'No uploaded files information found in the report'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif report_type in ['comprehensive', 'ga4', 'shopify', 'hotjar']:
                # For report types, mark the report as inactive instead of physically deleting
                cro_report.status = 'inactive'  # Assuming you add 'inactive' as a valid status choice in the model
                cro_report.save()
                return Response(
                    {'success': f'Report has been marked as inactive'},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'error': f'Invalid report_type for deletion: {report_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Process based on report_type for retrieval
        if report_type == 'comprehensive':
            response_data = {
                'report_id': cro_report.id,
                'report_type': 'comprehensive',
                'report_content': cro_report.comprehensive_report,
                'created_at': cro_report.created_at,
                'download_info': {
                    'filename': f'comprehensive_report_{report_id}.txt',
                    'content_type': 'text/markdown'
                }
            }
        elif report_type == 'ga4':
            response_data = {
                'report_id': cro_report.id,
                'report_type': 'ga4',
                'report_content': cro_report.ga4_report,
                'created_at': cro_report.created_at,
                'download_info': {
                    'filename': f'ga4_report_{report_id}.md',
                    'content_type': 'text/markdown'
                }
            }
        elif report_type == 'shopify':
            response_data = {
                'report_id': cro_report.id,
                'report_type': 'shopify',
                'report_content': cro_report.shopify_report,
                'created_at': cro_report.created_at,
                'download_info': {
                    'filename': f'shopify_report_{report_id}.md',
                    'content_type': 'text/markdown'
                }
            }
        elif report_type == 'hotjar':
            response_data = {
                'report_id': cro_report.id,
                'report_type': 'hotjar',
                'report_content': cro_report.hotjar_report,
                'created_at': cro_report.created_at,
                'download_info': {
                    'filename': f'hotjar_report_{report_id}.md',
                    'content_type': 'text/markdown'
                }
            }
        elif report_type == 'csv':
            # For CSV files, we need the report_name to identify which CSV
            if not report_name:
                return Response(
                    {'error': 'report_name is required for CSV files'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get file information based on report_name
            csv_info = None
            if cro_report.uploaded_files_info:
                # Check in GA4 files
                if 'ga4_files' in cro_report.uploaded_files_info:
                    for file_name in cro_report.uploaded_files_info['ga4_files']:
                        if file_name == report_name:
                            csv_info = {
                                'name': file_name,
                                'type': 'ga4',
                                'report_id': cro_report.id
                            }
                            break

                # Check in Shopify files if not found
                if not csv_info and 'shopify_files' in cro_report.uploaded_files_info:
                    for file_name in cro_report.uploaded_files_info['shopify_files']:
                        if file_name == report_name:
                            csv_info = {
                                'name': file_name,
                                'type': 'shopify',
                                'report_id': cro_report.id
                            }
                            break

                # Check in Hotjar files if not found
                if not csv_info and 'hotjar_files' in cro_report.uploaded_files_info:
                    for file_name in cro_report.uploaded_files_info['hotjar_files']:
                        if file_name == report_name:
                            csv_info = {
                                'name': file_name,
                                'type': 'hotjar',
                                'report_id': cro_report.id
                            }
                            break

            if not csv_info:
                return Response(
                    {'error': f'CSV file "{report_name}" not found in the report'},
                    status=status.HTTP_404_NOT_FOUND
                )

            response_data = {
                'report_id': cro_report.id,
                'report_type': 'csv',
                'csv_info': csv_info,
                'created_at': cro_report.created_at,
                'download_info': {
                    'filename': report_name,
                    'content_type': 'text/csv',
                    'csv_id': f"{csv_info['type']}_{cro_report.id}_{report_name.replace(' ', '_')}"
                }
            }
        else:
            return Response(
                {'error': f'Invalid report_type: {report_type}. Valid types are: comprehensive, ga4, shopify, hotjar, csv'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(response_data, status=status.HTTP_200_OK)

    except CROReport.DoesNotExist:
        return Response(
            {'error': 'Report not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ask_ai_assistant(request):
    """
    API endpoint to ask an AI assistant a question using user token and question.

    Request JSON:
    {
        'user_token': str,  # Required
        'question': str,    # Required
    }
    """
def list_cro_reports(request):
    """API endpoint to list all CRO reports for the authenticated user"""
    try:
        reports = CROReport.objects.filter(user=request.user)

        reports_data = []
        for report in reports:
            reports_data.append({
                'report_id': report.id,
                'status': report.status,
                'created_at': report.created_at,
                'processing_time': report.processing_time_seconds,
                'file_info': report.uploaded_files_info,
                'completion_percentage': report.completion_percentage,
                'api_provider': report.api_provider,
                'has_ga4_data': report.has_ga4_data,
                'has_shopify_data': report.has_shopify_data,
                'has_hotjar_data': report.has_hotjar_data,
            })

        return Response(
            {
                'reports': reports_data,
                'total_count': len(reports_data)
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from typing import Optional
from typing_extensions import TypedDict

def generate_chat_response(user, user_question: str, report_id: Optional[int] = None) -> str:
    """
    Generate a response from an AI assistant based on user token, user question,
    and report ID. Utilize context from user settings and relevant reports.

    Args:
        user: User instance
        user_question: User's input question
        report_id: Optional ID of the report to use as context

    Returns:
        AI-generated response as a string
    """
    try:
        # Retrieve user settings
        user_settings = UserSettings.objects.get(user=user)
        user_provider = user_settings.ai_provider
        if user_provider == "OpenAI":
            user_model = "openai/gpt-4o"  # or "openai/gpt-4-turbo"
            user_key = user_settings.openai_key
        else:
            user_model = "gemini/gemini-2.5-flash"  # Use latest version
            user_key = user_settings.google_key

        ai_model = user_model

        # Prepare context dict for report content
        context = {}

        # Check if user is asking for a comparison between reports
        # Look for comparison keywords and report type mentions
        is_comparison_question = any(keyword in user_question.lower() for keyword in
                                  ['compare', 'comparison', 'versus', 'vs', 'difference',
                                   'differences', 'differentiate', 'contrast'])

        # If report_id exists, attempt to add all available report texts as context
        if report_id:
            try:
                # Always get the primary report first
                cro_report = CROReport.objects.get(id=report_id, user=user)

                # Add comprehensive report
                if cro_report.comprehensive_report:
                    context['cro_report'] = cro_report.comprehensive_report

                # Add GA4 report
                if cro_report.ga4_report:
                    context['ga4_report'] = cro_report.ga4_report

                # Add Shopify report
                if cro_report.shopify_report:
                    context['shopify_report'] = cro_report.shopify_report

                # Add Hotjar report
                if cro_report.hotjar_report:
                    context['hotjar_report'] = cro_report.hotjar_report

                # For comparison questions, try to find other reports to compare with
                if is_comparison_question and user:
                    # Get additional reports if available
                    other_reports = CROReport.objects.filter(
                        user=user,
                        status='completed'
                    ).exclude(id=report_id).order_by('-created_at')[:3]  # Get up to 3 other reports

                    # Add other reports to context with their IDs to distinguish them
                    for i, other_report in enumerate(other_reports):
                        # Add reports with identifiers so AI can reference them properly
                        if other_report.comprehensive_report:
                            context[f'cro_report_{other_report.id}'] = other_report.comprehensive_report
                        if other_report.ga4_report:
                            context[f'ga4_report_{other_report.id}'] = other_report.ga4_report
                        if other_report.shopify_report:
                            context[f'shopify_report_{other_report.id}'] = other_report.shopify_report
                        if other_report.hotjar_report:
                            context[f'hotjar_report_{other_report.id}'] = other_report.hotjar_report

                        # Add report metadata
                        context[f'report_{other_report.id}_info'] = (
                            f"Report ID: {other_report.id}, "
                            f"Created: {other_report.created_at.strftime('%Y-%m-%d')}, "
                            f"Name: {other_report.report_name or f'Report {other_report.id}'}"
                        )

                # If no reports found
                if not any([context.get('cro_report'), context.get('ga4_report'),
                           context.get('shopify_report'), context.get('hotjar_report')]):
                    context['cro_report'] = "No report content found."

            except CROReport.DoesNotExist:
                context['cro_report'] = "No report found."

        # Include user question in variables
        question = user_question

        # ---------- TypedDict for schema ----------
        class ContextSchema(TypedDict, total=False):
            cro_report: str
            traffic: Optional[int]
            conversion_rate: Optional[float]
            sessions: Optional[int]
            bounce_rate: Optional[float]
            session_duration: Optional[float]
            pages_per_session: Optional[float]
            average_order_value: Optional[float]
            cart_abandonment: Optional[float]
            revenue: Optional[float]

        # ---------- Core analysis logic ----------
        def analyze_context_logic(context: ContextSchema) -> str:
            if not context:
                return "No context provided. Unable to generate insights."

            analysis = "### Contextual Analysis Report ###\n\n"
            analysis += "#### Context Composition ####\n"
            for key, value in context.items():
                analysis += f"- **{key.replace('_', ' ').title()}**: {value}\n"

            context_keys = set(context.keys())

            # Traffic and Conversion Analysis
            if any(key in context_keys for key in ['traffic', 'conversion_rate', 'sessions']):
                analysis += "\n#### Traffic and Conversion Insights ####\n"
                analysis += "- Analyzing traffic sources and conversion dynamics\n"
                if 'conversion_rate' in context:
                    rate = context['conversion_rate']
                    analysis += f"  * Current Conversion Rate: {rate}%\n"
                    if rate < 3:
                        analysis += "  * Recommendation: Significant optimization needed\n"
                    elif rate < 5:
                        analysis += "  * Recommendation: Moderate improvements can boost performance\n"
                    else:
                        analysis += "  * Recommendation: Maintain and incrementally refine strategies\n"

            # User Behavior Analysis
            if any(key in context_keys for key in ['bounce_rate', 'session_duration', 'pages_per_session']):
                analysis += "\n#### User Behavior Insights ####\n"
                analysis += "- Evaluating user engagement and site interaction patterns\n"
                if 'bounce_rate' in context:
                    bounce_rate = context['bounce_rate']
                    analysis += f"  * Current Bounce Rate: {bounce_rate}%\n"
                    if bounce_rate > 60:
                        analysis += "  * Critical: High bounce rate indicates major UX or content issues\n"
                    elif bounce_rate > 50:
                        analysis += "  * Warning: Bounce rate suggests potential optimization opportunities\n"
                    else:
                        analysis += "  * Good: Bounce rate is within acceptable ranges\n"

            # E-commerce Specific Analysis
            if any(key in context_keys for key in ['average_order_value', 'cart_abandonment', 'revenue']):
                analysis += "\n#### E-commerce Performance ####\n"
                analysis += "- Assessing sales funnel and revenue optimization opportunities\n"
                if 'average_order_value' in context:
                    aov = context['average_order_value']
                    analysis += f"  * Average Order Value: ${aov:.2f}\n"
                    if aov < 50:
                        analysis += "  * Opportunity: Strategies to increase order value\n"
                    elif aov < 100:
                        analysis += "  * Good: Moderate order value, focus on upselling\n"
                    else:
                        analysis += "  * Excellent: Strong average order value\n"

            return analysis

        # ---------- Tool wrapper for agent ----------
        @function_tool()
        def analyze_context(context: ContextSchema) -> str:
            return analyze_context_logic(context)

        # ---------- Agent instructions ----------
        agent_instructions = (
            "You are an advanced Conversion Rate Optimization (CRO) AI Chatbot, specializing in providing expert insights "
            "and strategic recommendations for digital performance optimization.\n\n"
            "CONVERSATIONAL INTELLIGENCE:\n"
            "- Identify the nature of user queries and respond appropriately\n"
            "- For greetings or casual conversation, respond in a friendly, personalized manner addressing the user by name\n"
            "- For CRO-related questions, provide detailed expert analysis using provided context if available\n"
            "- For questions unrelated to CRO, politely explain your specialization while still being helpful\n\n"
            "CONTEXT UTILIZATION:\n"
            "- You may have access to multiple reports (CRO report, GA4 report, Shopify report, Hotjar report)\n"
            "- Use the most relevant report(s) based on the user's question\n"
            "- GA4 report contains analytics data about website traffic, behavior and conversions\n"
            "- Shopify report contains e-commerce metrics like sales, revenue, and product performance\n"
            "- Hotjar report contains user behavior data such as heatmaps and user interaction patterns\n"
            "- The comprehensive CRO report integrates insights from all these data sources\n"
            "- For comparison questions, you may have access to multiple reports with unique identifiers (e.g., cro_report_123)\n"
            "- When comparing reports, clearly identify which report each insight comes from\n"
            "- Look for patterns, trends, improvements, or declines between reports\n\n"

            "CORE CAPABILITIES:\n"
            "- Analyze complex digital marketing and user experience data\n"
            "- Generate actionable CRO strategies\n"
            "- Provide deep insights into conversion funnel performance\n\n"

            "CONTEXT-DRIVEN ANALYSIS PROTOCOL:\n"
            "1. Carefully examine the provided context\n"
            "2. Extract key performance indicators and strategic insights\n"
            "3. Develop targeted recommendations based on the specific context\n\n"

            "RESPONSE METHODOLOGY:\n"
            "- Always ground recommendations in the provided data context\n"
            "- Break down complex concepts into clear, actionable insights\n"
            "- Prioritize recommendations that directly impact conversion rates\n"
            "- Use a structured, professional communication style\n\n"

            "ANALYTICAL FRAMEWORK:\n"
            "- Identify conversion barriers\n"
            "- Suggest optimization strategies\n"
            "- Quantify potential business impact\n"
            "- Provide step-by-step implementation guidance\n\n"

            "CONTEXT UTILIZATION:\n"
            "- Treat the provided context as your primary source of insights\n"
            "- If context is insufficient, ask clarifying questions\n"
            "- Cross-reference multiple data points within the context\n\n"

            "FRONTEND FORMATTING REQUIREMENTS:\n"
            "- Use clean, visually structured text without markdown symbols\n"
            "- For headings: use CAPITAL LETTERS for main sections\n"
            "- For subheadings: use Title Case for clear visual hierarchy\n"
            "- For metrics: format as 'Metric Name: Value' with clear labeling\n"
            "- For lists: use proper bullet points with a space after each dash\n"
            "- For tables: ensure proper alignment with clear row separation\n"
            "- For data comparisons: use clear visual separation between different data points\n"
            "- Include line breaks between paragraphs for better readability\n"
            "- Keep paragraphs concise (3-5 lines) for better mobile display\n"
            "- Highlight important insights with bullet points\n\n"

            "RESPONSE FORMAT STRUCTURE:\n"
            "PRIMARY HEADING\n"
            "Introductory paragraph with key points.\n\n"
            "Subheading 1\n"
            "- Key finding 1 with metric highlighted: Value\n"
            "- Key finding 2 with explanation\n\n"
            "Subheading 2\n"
            "Detailed analysis paragraph.\n\n"
            "RECOMMENDATIONS\n"
            "1. First recommended action\n"
            "2. Second recommended action\n\n"
            "CONCLUSION\n"
            "Final insights and next steps.\n\n"

            "Your ultimate goal is to transform raw data and contextual information "
            "into a visually structured, easy-to-read, strategic roadmap for improving conversion performance."
        )

        # Disable tracing for security
        set_tracing_disabled(disabled=True)

        # Configure LiteLLM model with appropriate settings
        litellm_model = LitellmModel(
            model=ai_model,
            api_key=user_key,
        )

        # Create the agent with context analysis tool
        agent = Agent(
            name="CRO Optimization Chatbot",
            instructions=agent_instructions,
            model=litellm_model,
            tools=[analyze_context] if context else []
        )

        # Prepare the prompt with context analysis
        prompt = f"User Question: {question}\n\n"
        # Get user's name for personalization
        user_name = user.first_name if user and hasattr(user, 'first_name') and user.first_name else user.username if user and hasattr(user, 'username') else ""

        # Add personalization info
        prompt += f"User's name: {user_name if user_name else 'Not available'}\n\n"

        # Add context if available
        if context:
            context_analysis = analyze_context_logic(context)  # ✅ plain function call
            prompt += f"Context Analysis:\n{context_analysis}\n\n"

            # Specify which reports are available for reference
            available_reports = []
            comparison_reports = {}

            # Identify primary reports
            if 'cro_report' in context:
                available_reports.append("Comprehensive CRO Report")
            if 'ga4_report' in context:
                available_reports.append("Google Analytics 4 Report")
            if 'shopify_report' in context:
                available_reports.append("Shopify E-commerce Report")
            if 'hotjar_report' in context:
                available_reports.append("Hotjar User Behavior Report")

            # Identify additional reports for comparison
            for key in context.keys():
                if '_report_' in key and key.endswith('_info'):
                    report_id = key.split('_')[1]
                    comparison_reports[report_id] = context[key]

            if available_reports:
                prompt += f"Available primary reports for reference: {', '.join(available_reports)}\n\n"

            if comparison_reports:
                prompt += "Additional reports available for comparison:\n"
                for report_id, info in comparison_reports.items():
                    prompt += f"- {info}\n"
                prompt += "\n"

                # Add comparison guidance
                prompt += "COMPARISON GUIDANCE:\n"
                prompt += "- This appears to be a comparison question across multiple reports\n"
                prompt += "- Identify key metrics and insights from each report\n"
                prompt += "- Highlight significant changes, improvements, or declines\n"
                prompt += "- Organize comparison by category (traffic, revenue, user behavior, etc.)\n"
                prompt += "- Present findings as a structured comparison with clear attributions to each report\n\n"

        prompt += "Instructions:\n"
        prompt += "1. Determine if this is a greeting, a CRO-related question, a comparison question, or an unrelated question\n"
        prompt += "2. For greetings: Respond warmly using the user's name and briefly explain your CRO capabilities\n"
        prompt += "3. For CRO questions: Provide expert analysis using the most relevant report data based on the question\n"
        prompt += "4. For comparison questions: Clearly structure your response to compare metrics and insights between reports\n"
        prompt += "5. For unrelated questions: Politely explain your CRO specialization but still try to be helpful\n"
        prompt += "6. Always maintain a conversational, helpful tone\n"
        prompt += "7. Structure your response with proper headings using CAPITAL LETTERS for main sections\n"
        prompt += "8. Use Title Case for subheadings to make them stand out\n"
        prompt += "9. Use bullet points and proper spacing to make your response visually appealing\n"
        prompt += "10. Keep paragraphs short (3-5 lines) for better readability on all devices\n"
        prompt += "11. Present key metrics clearly as 'Metric Name: Value'\n\n"
        prompt += "Now, please provide an appropriate response to the user's question."

        # Run the agent
        async def run_agent():
            result = await Runner.run(agent, prompt)
            return result.final_output

        response = asyncio.run(run_agent())
        return response

    except UserSettings.DoesNotExist:
        return "User settings not found. Please configure your AI settings."
    except Exception as e:
        return f"An error occurred while generating response: {str(e)}"




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_api_keys(request):
    """Test endpoint to verify API keys are loaded correctly"""
    try:
        api_keys_status = {}

        # Check OpenAI API Key
        openai_key = os.environ.get("OPENAI_API_KEY")
        api_keys_status['openai'] = {
            'present': bool(openai_key),
            'length': len(openai_key) if openai_key else 0,
            'starts_with': openai_key[:10] + "..." if openai_key else None
        }

        # Check Google API Key
        google_key = os.environ.get("GOOGLE_API_KEY")
        api_keys_status['google'] = {
            'present': bool(google_key),
            'length': len(google_key) if google_key else 0,
            'starts_with': google_key[:10] + "..." if google_key else None
        }

        # List all environment variables that end with _API_KEY
        all_api_keys = []
        for key in os.environ:
            if key.endswith("_API_KEY"):
                all_api_keys.append(key)

        # Test provider extraction for common models
        test_providers = [
            "openai/gpt-4",
            "openai/gpt-3.5-turbo",
            "gemini/gemini-2.0-flash-exp",
            "google/gemini-2.0-flash-exp",
            "gemini/gemini-2.0-flash",
            "gemini/gemini-pro"
        ]

        provider_tests = {}
        for provider in test_providers:
            try:
                api_key, model = get_api_key_for_provider(provider)
                provider_tests[provider] = {
                    'status': 'success',
                    'model': model,
                    'has_api_key': bool(api_key),
                    'api_key_length': len(api_key) if api_key else 0
                }
            except Exception as e:
                provider_tests[provider] = {
                    'status': 'error',
                    'error': str(e)
                }

        # Add additional test for standalone providers
        standalone_providers = ["gemini", "openai", "google"]
        for provider in standalone_providers:
            try:
                api_key, model = get_api_key_for_provider(provider)
                provider_tests[f"{provider} (standalone)"] = {
                    'status': 'success',
                    'model': model,
                    'has_api_key': bool(api_key),
                    'api_key_length': len(api_key) if api_key else 0
                }
            except Exception as e:
                provider_tests[f"{provider} (standalone)"] = {
                    'status': 'error',
                    'error': str(e)
                }

        return Response({
            'status': 'success',
            'api_keys': api_keys_status,
            'available_api_keys': all_api_keys,
            'provider_tests': provider_tests,
            'message': 'API key configuration test completed'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


import asyncio
import tempfile

# New API to collect user token & CSV files, categorize files, run async report functions, and return reports
@api_view(['POST'])
def upload_csv_files_with_token(request):
    """
    API endpoint to collect user token & CSV files,
    authenticate using the token from UserToken model,
    categorize uploaded CSV files, run analyses with async functions,
    and return user info, categorized file names, and generated reports including comprehensive report.

    Expected fields in POST:
    - accessToken: string (user token)
    - csv_files: list of files (uploaded CSV files)

    Response JSON:
    {
        "user": {
            "id": int,
            "username": str,
            "email": str
        },
        "categorized_files": {
            "ga4_files": [file names],
            "shopify_files": [file names],
            "hotjar_files": [file names]
        },
        "reports": {
            "ga4_report": str or None,
            "shopify_report": str or None,
            "hotjar_report": str or None,
            "comprehensive_report": str or None
        },
        "report_id": int,
        "report_name": str or None
    }
    """
    access_token = request.data.get('accessToken')
    uploaded_files = request.FILES.getlist('csv_files')

    if not access_token:
        return Response({"error": "accessToken is required."}, status=status.HTTP_400_BAD_REQUEST)
    if not uploaded_files:
        return Response({"error": "csv_files are required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_token_obj = UserToken.objects.get(token=access_token)
        user = user_token_obj.user
    except UserToken.DoesNotExist:
        return Response({"error": "Invalid accessToken."}, status=status.HTTP_401_UNAUTHORIZED)


    user_setting_obj = UserSettings.objects.get(user=user)
    user_provider = user_setting_obj.ai_provider
    if user_provider == "OpenAI":
        user_model = "openai/gpt-4o"  # or "openai/gpt-4-turbo"
        user_key = user_setting_obj.openai_key
    else:
        user_model = "gemini/gemini-2.5-flash"  # Use latest version
        user_key = user_setting_obj.google_key

    print(user_model,"MY DATA--------",user_key)

    # Categorize files using existing helper function
    ga4_files, shopify_files, hotjar_files = categorize_csv_files(uploaded_files)

    # Create temporary directory and save files
    with tempfile.TemporaryDirectory() as temp_dir:
        from .views import save_uploaded_files, comprehensive_cro_audit
        from api.models import CROReport
        import time

        ga4_paths = save_uploaded_files(ga4_files, temp_dir) if ga4_files else []
        shopify_paths = save_uploaded_files(shopify_files, temp_dir) if shopify_files else []
        hotjar_paths = save_uploaded_files(hotjar_files, temp_dir) if hotjar_files else []

        # Run async analysis functions synchronously using asyncio.run or loop
        # Import the async functions from current module
        from .views import ga4_function, hotjar_function, shopify_function

        # Run functions and capture results
        async def run_all():
            tasks = []
            if ga4_paths:
                tasks.append(ga4_function(user_token_obj.token,user_model,user_key, ga4_paths))
            else:
                tasks.append(asyncio.sleep(0, result=None))
            if shopify_paths:
                tasks.append(shopify_function(user_token_obj.token,user_model,user_key, shopify_paths))
            else:
                tasks.append(asyncio.sleep(0, result=None))
            if hotjar_paths:
                tasks.append(hotjar_function(user_token_obj.token,user_model,user_key, hotjar_paths))
            else:
                tasks.append(asyncio.sleep(0, result=None))

            results = await asyncio.gather(*tasks)
            return results

        try:
            results = asyncio.run(run_all())
        except RuntimeError:
            # Handle event loop already running error by using new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            results = loop.run_until_complete(run_all())
            loop.close()

        ga4_report, shopify_report, hotjar_report = results

        # Generate comprehensive report combining individual reports if available
        responses = {
            'ga4': ga4_report,
            'shopify': shopify_report,
            'hotjar': hotjar_report
        }

        comprehensive_report = None
        if any(r for r in responses.values() if r and not str(r).startswith("Error")):
            # Using asyncio.run to call async comprehensive_cro_audit
            async def run_comprehensive():
                return await comprehensive_cro_audit(user_token_obj.token,user_model,user_key, responses)

            try:
                comprehensive_report = asyncio.run(run_comprehensive())
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                comprehensive_report = loop.run_until_complete(run_comprehensive())
                loop.close()

        # Save reports and metadata in CROReport model
        import time
        start_time = time.time()

        # Generate a report name - optionally customizable later
        report_name = f"CRO Report {now().strftime('%Y-%m-%d %H:%M:%S')} for {user.username}"

        cro_report = CROReport.objects.create(
            user=user,
            api_provider=user_model,
            status='completed',
            ga4_report=ga4_report,
            hotjar_report=hotjar_report,
            shopify_report=shopify_report,
            comprehensive_report=comprehensive_report,
            uploaded_files_info={
                'ga4_files': [f.name for f in ga4_files],
                'shopify_files': [f.name for f in shopify_files],
                'hotjar_files': [f.name for f in hotjar_files],
                'total_files': len(uploaded_files)
            },
            processing_time_seconds=time.time() - start_time,
            report_name=report_name
        )

    response_data = {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email
        },
        "categorized_files": {
            "ga4_files": [f.name for f in ga4_files],
            "shopify_files": [f.name for f in shopify_files],
            "hotjar_files": [f.name for f in hotjar_files]
        },
        "reports": {
            "ga4_report": ga4_report,
            "shopify_report": shopify_report,
            "hotjar_report": hotjar_report,
            "comprehensive_report": comprehensive_report
        },
        "report_id": cro_report.id,
        "report_name": cro_report.report_name,
    }

    return Response(response_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def debug_provider(request):
    """Debug endpoint to test provider parsing with any input"""
    try:
        api_provider = request.data.get('api_provider', 'gemini')

        # Show what we received
        debug_info = {
            'received_provider': api_provider,
            'provider_type': type(api_provider).__name__,
            'provider_parts': api_provider.split('/') if api_provider else [],
        }

        # Test the parsing
        try:
            api_key, model = get_api_key_for_provider(api_provider)
            debug_info['parsing_result'] = {
                'status': 'success',
                'model': model,
                'has_api_key': bool(api_key),
                'api_key_length': len(api_key) if api_key else 0,
                'api_key_prefix': api_key[:20] + "..." if api_key else None
            }
        except Exception as e:
            debug_info['parsing_result'] = {
                'status': 'error',
                'error': str(e)
            }

        # Show all environment variables ending with API_KEY
        api_env_vars = {}
        for key, value in os.environ.items():
            if key.endswith('_API_KEY'):
                api_env_vars[key] = {
                    'present': bool(value),
                    'length': len(value) if value else 0,
                    'prefix': value[:10] + "..." if value else None
                }

        debug_info['environment_variables'] = api_env_vars

        return Response(debug_info, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def test_comprehensive_audit(request):
    """Test endpoint to debug the comprehensive CRO audit function with sample data"""
    try:
        api_provider = request.data.get('api_provider', 'gemini')

        # Use professional sample data for testing
        sample_responses = {
            'ga4': """## 0. KPIs

| Metric                      | Value | Source |
| --------------------------- | ----- | ---------------------------------------------- |
| Sessions                    | 8,730 | Google Analytics 4 Traffic Acquisition        |
| Users                       | 7,280 | Google Analytics 4 Traffic Acquisition        |
| Conversion Rate             | 6.7%  | Google Analytics 4 E-commerce                 |
| Bounce Rate                 | 42.1% | Google Analytics 4 Engagement                 |
| Average Session Duration    | 3m 45s| Google Analytics 4 Engagement                 |

## Traffic Analysis
Primary traffic sources: Organic Search (3,150 sessions), Email (820 sessions), Paid Search (2,400 sessions)
Device performance: Desktop shows 33.8% bounce rate, Mobile 42.1% bounce rate, Tablet 46.2% bounce rate
Conversion funnel: Significant drop-off between Add to Cart (1,800) and Begin Checkout (950)""",

            'hotjar': """## 0. KPIs

| Metric                         | Value | Source                    |
| :----------------------------- | :---- | :------------------------ |
| Top Mobile Interaction         | Navigation Menu (95 clicks) | Hotjar Heatmap Mobile |
| Top Desktop Interaction        | Currency Selector (44 clicks) | Hotjar Heatmap Desktop |
| Primary UX Friction Point      | Non-responsive Slider | Hotjar Click Analysis |

## User Behavior Analysis
Mobile users heavily rely on hamburger menu navigation (95 clicks, 9.68% of interactions)
Desktop users frequently access localization features (44 clicks, 6.08% of interactions)
Collection pagination indicates browsing behavior but potential discovery issues""",

            'shopify': """## 0. KPIs

| Metric | Value | Source |
|--------|-------|--------|
| Total Revenue | $265,973.29 | Shopify Sales Analytics |
| Total Orders | 2,004 | Shopify Order Management |
| Average Order Value | $132.77 | Calculated from Revenue/Orders |
| Top Product Revenue | Gothic Romance ($26,211.47) | Shopify Product Analytics |

## E-commerce Performance
Primary sales channel: Online Store generating $265,973.29 from 2,004 orders
Social commerce: Facebook ($342.71), Instagram contributing to multi-channel strategy
Product search insights: "murex" (24 searches), "bayberry" (19 searches), "sand dollar" (16 searches)
Return analysis: -$2,653.04 in returns requiring investigation"""
        }

        # Override with actual responses if provided
        if request.data.get('use_real_data'):
            # Get the latest successful report from database
            try:
                latest_report = CROReport.objects.filter(
                    user=request.user,
                    status='completed'
                ).order_by('-created_at').first()

                if latest_report:
                    sample_responses = {}
                    if latest_report.ga4_report and not latest_report.ga4_report.startswith("Error"):
                        sample_responses['ga4'] = latest_report.ga4_report
                    if latest_report.hotjar_report and not latest_report.hotjar_report.startswith("Error"):
                        sample_responses['hotjar'] = latest_report.hotjar_report
                    if latest_report.shopify_report and not latest_report.shopify_report.startswith("Error"):
                        sample_responses['shopify'] = latest_report.shopify_report
            except Exception as e:
                print(f"Could not get latest report: {e}")

        # Test the comprehensive audit function
        print(f"Testing comprehensive audit with: {list(sample_responses.keys())}")

        comprehensive_result = comprehensive_cro_audit_sync(api_provider, sample_responses)

        return Response({
            'status': 'success',
            'api_provider': api_provider,
            'input_data_keys': list(sample_responses.keys()),
            'input_data_lengths': {k: len(v) for k, v in sample_responses.items()},
            'comprehensive_result': comprehensive_result,
            'result_length': len(comprehensive_result),
            'result_preview': comprehensive_result[:500] + "..." if len(comprehensive_result) > 500 else comprehensive_result
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'status': 'error',
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


import uuid
from django.utils.timezone import now
from django.db.models import Max
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import ChatMessage
from api.models import UserToken
import uuid

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

@api_view(['POST'])
def get_or_create_chat_thread(request):
    """
    API endpoint to get current active chat thread for the user,
    or create a new thread if none exists or is empty.

    Request JSON:
    {
        "user_token": str,
        "create_new": bool          # Optional - if true, always creates a new thread
    }

    Response JSON:
    {
        "chat_id": str,
        "thread_name": str,
        "report_id": int            # Optional - ID of latest report if available
    }
    """
    user_token = request.data.get('user_token')
    create_new = request.data.get('create_new', False)  # Default to False

    if not user_token:
        return Response({'error': 'user_token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Query token from database and get user
    try:
        user_token_obj = UserToken.objects.get(token=user_token)
        user = user_token_obj.user
    except UserToken.DoesNotExist:
        return Response({'error': 'Invalid or unknown user_token'}, status=status.HTTP_401_UNAUTHORIZED)

    # Prepare user data for the response
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name if hasattr(user, 'first_name') else "",
        "last_name": user.last_name if hasattr(user, 'last_name') else ""
    }

    # Generate a new chat ID in these cases:
    # 1. User explicitly requested a new thread (create_new=True)
    # 2. No previous threads exist
    # 3. The most recent thread has no messages

    # Start by assuming we'll need to create a new thread
    create_new_thread = create_new
    chat_id = None
    thread_name = None

    if not create_new:
        # Find the most recently active thread for the user
        last_threads = ChatMessage.objects.filter(user=user) \
            .values('chat_id') \
            .annotate(last_msg_time=Max('timestamp')) \
            .order_by('-last_msg_time')

        if last_threads:
            # Get the most recent thread
            most_recent_thread = last_threads[0]
            most_recent_chat_id = most_recent_thread['chat_id']

            # Count messages in this thread
            message_count = ChatMessage.objects.filter(user=user, chat_id=most_recent_chat_id).count()

            # If the thread has messages, use it
            if message_count > 0:
                chat_id = most_recent_chat_id
                thread_name = f"Chat Thread {chat_id[:8]}"
                create_new_thread = False

    # Create a new thread if needed
    if create_new_thread or not chat_id:
        chat_id = str(uuid.uuid4())
        thread_name = f"New Chat {now().strftime('%Y-%m-%d %H:%M')}"

    # additionally find the latest completed CROReport for the user
    try:
        latest_report = CROReport.objects.filter(user=user, status='completed').order_by('-created_at').first()
        report_id = latest_report.id if latest_report else None
    except Exception:
        report_id = None

    return Response({
        'chat_id': chat_id,
        'thread_name': thread_name,
        'report_id': report_id,
        'user': user_data,
        'is_new_thread': create_new_thread  # Indicate if this is a new thread
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def manage_profile(request):
    """
    API endpoint to get and update user profile information using user_token

    POST with only user_token: Retrieve current user profile details
    POST with user_token and other fields: Update user profile details

    Request JSON:
    {
        'user_token': str,           # Required for authentication
        'full_name': str,            # Optional - For updating name
        'email': str,                # Optional - For updating email
        'job': str,                  # Optional - For updating job title
        'company': str,              # Optional - For updating company name
    }

    Response: User profile information
    """
    try:
        user_token = request.data.get('user_token')
        print(user_token,"User Token")
        if not user_token:
            return Response(
                {'error': 'user_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user with token
        try:
            user_token_obj = UserToken.objects.get(token=user_token)
            user = user_token_obj.user
        except UserToken.DoesNotExist:
            return Response(
                {'error': 'Invalid user_token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get or create user settings
        user_settings, created = UserSettings.objects.get_or_create(user=user)

        # Check if we have any update fields (anything besides user_token)
        is_update_request = any(key in request.data for key in ['full_name', 'email', 'job', 'company'])

        if not is_update_request:
            # Return current profile information
            # Try to get job and company info from both UserSettings and UserToken models
            try:
                # First try UserSettings (new approach)
                job_title = user_settings.job_title if hasattr(user_settings, 'job_title') else None
                company_name = user_settings.company_name if hasattr(user_settings, 'company_name') else None

                # If not found, try UserToken (old approach)
                if not job_title or not company_name:
                    user_token_obj = UserToken.objects.filter(user=user).first()
                    if user_token_obj:
                        if not job_title:
                            job_title = user_token_obj.job_title
                        if not company_name:
                            company_name = user_token_obj.company_name
            except Exception as e:
                print(f"Error fetching job/company info: {str(e)}")
                job_title = ""
                company_name = ""

            # Get the proper URL for the profile picture
            profile_picture_url = None
            try:
                user_token_obj = UserToken.objects.get(user=user)
                profile_picture_url = user_token_obj.profile_picture.url
            except UserToken.DoesNotExist:
                pass
            print("Fetching profile picture URL...",profile_picture_url)
            try:
                if user_settings.profile_picture:
                    profile_picture_url = user_settings.profile_picture.url
            except Exception as e:
                print(f"Error getting profile picture URL: {str(e)}")

            profile_data = {
                "id": user.id,
                "username": user.username,
                "full_name": user.get_full_name() or user.username,
                "email": user.email,
                "job": job_title or "",
                "company": company_name or "",
                "profile_picture": profile_picture_url,
                "account_preferences": {
                    "receive_email_updates": user_settings.receive_email_updates if hasattr(user_settings, 'receive_email_updates') else True,
                    "show_online_status": user_settings.show_online_status if hasattr(user_settings, 'show_online_status') else False,
                    "enable_dark_mode": user_settings.enable_dark_mode if hasattr(user_settings, 'enable_dark_mode') else False
                }
            }
            print(profile_data)
            return Response(profile_data, status=status.HTTP_200_OK)
        else:
            # Update profile information
            data = request.data

            # Update user model fields
            if data.get('full_name'):
                name_parts = data['full_name'].split(' ', 1)
                user.first_name = name_parts[0]
                user.last_name = name_parts[1] if len(name_parts) > 1 else ''
                user.save()

            if data.get('email'):
                user.email = data['email']
                user.save()

            # Update fields in both UserSettings and UserToken for compatibility
            # First, update UserSettings if the fields exist
            if data.get('job'):
                if hasattr(user_settings, 'job_title'):
                    user_settings.job_title = data['job']

            if data.get('company'):
                if hasattr(user_settings, 'company_name'):
                    user_settings.company_name = data['company']

            # Also update UserToken for backward compatibility
            try:
                user_token_obj = UserToken.objects.filter(token=user_token).first()
                if user_token_obj:
                    if data.get('job'):
                        user_token_obj.job_title = data['job']
                    if data.get('company'):
                        user_token_obj.company_name = data['company']
                    user_token_obj.save()
            except Exception as e:
                print(f"Error updating UserToken job/company: {str(e)}")

            # Handle profile picture upload
            if 'profile_picture' in request.FILES:
                image_file = request.FILES['profile_picture']

                # Validate file size (maximum 5MB)
                if image_file.size > 5 * 1024 * 1024:
                    return Response(
                        {'error': 'Image size cannot exceed 5MB'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Validate file type
                valid_extensions = ['.jpg', '.jpeg', '.png', '.gif']
                file_ext = os.path.splitext(image_file.name)[1].lower()
                if file_ext not in valid_extensions:
                    return Response(
                        {'error': f'Invalid file format. Supported formats are: {", ".join(valid_extensions)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Update the profile picture
                user_settings.profile_picture = image_file

                # Also update UserToken model if it has profile_picture field
                try:
                    if hasattr(user_token_obj, 'profile_picture'):
                        user_token_obj.profile_picture = image_file
                        user_token_obj.save()
                except Exception as e:
                    print(f"Error updating profile picture in UserToken: {str(e)}")

            # Update account preferences if provided
            account_prefs = data.get('account_preferences', {})
            if account_prefs:
                user_settings.receive_email_updates = account_prefs.get('receive_email_updates', user_settings.receive_email_updates)
                user_settings.show_online_status = account_prefs.get('show_online_status', user_settings.show_online_status)
                user_settings.enable_dark_mode = account_prefs.get('enable_dark_mode', user_settings.enable_dark_mode)

            user_settings.save()

            # Return updated profile
            updated_profile_data = {
                "id": user.id,
                "username": user.username,
                "full_name": user.get_full_name() or user.username,
                "email": user.email,
                "job": (user_settings.job_title if hasattr(user_settings, 'job_title') else "") or
                    (user_token_obj.job_title if user_token_obj and hasattr(user_token_obj, 'job_title') else ""),
                "company": (user_settings.company_name if hasattr(user_settings, 'company_name') else "") or
                        (user_token_obj.company_name if user_token_obj and hasattr(user_token_obj, 'company_name') else ""),
                "profile_picture": None,  # Will be updated below
                "account_preferences": {
                    "receive_email_updates": user_settings.receive_email_updates,
                    "show_online_status": user_settings.show_online_status,
                    "enable_dark_mode": user_settings.enable_dark_mode
                }
            }

            # Save and get the proper profile picture URL
            user_settings.save()
            user_settings.refresh_from_db()

            # Update the profile picture URL in the response
            try:
                if user_settings.profile_picture:
                    updated_profile_data["profile_picture"] = request.build_absolute_uri(user_settings.profile_picture.url)
            except Exception as url_error:
                print(f"Error getting image URL: {str(url_error)}")
                updated_profile_data["profile_picture"] = None

            return Response(updated_profile_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
def get_all_reports(request):
    """
    API endpoint to retrieve all CRO reports with CSV file information and individual reports.

    This endpoint returns all completed reports for the authenticated user in a restructured format:
    - Comprehensive reports with their IDs
    - All uploaded CSV files information

    Request JSON:
    {
        "user_token": str    # Required - for user authentication
    }

    Response JSON:
    {
        "comprehensive_reports": [
            {
                "report_id": int,
                "report": str,
            },
            ...
        ],
        "individual_reports": [
            {
                "report_id": int,
                "ga4_report": str or null,
                "shopify_report": str or null,
                "hotjar_report": str or null
            },
            ...
        ],
        "csvs": {
            "all_files": [
                {
                    "name": str,
                    "id": int or str
                },
                ...
            ]
        }
    }
    """
    try:
        user_token = request.data.get('user_token')

        if not user_token:
            return Response(
                {'error': 'user_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user with token
        try:
            from .models import UserToken
            user_token_obj = UserToken.objects.get(token=user_token)
            user = user_token_obj.user
        except UserToken.DoesNotExist:
            return Response(
                {'error': 'Invalid user_token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get all completed reports for the user
        from .models import CROReport
        reports = CROReport.objects.filter(
            user=user,
            status='completed'
        ).order_by('-created_at')

        # Prepare response data in the new format
        comprehensive_reports = []
        individual_reports = []
        all_csvs = []

        for report in reports:
            # Add comprehensive report
            if report.comprehensive_report:
                comprehensive_reports.append({
                    'report_id': report.id,
                    'report': report.comprehensive_report
                })

            # Add individual reports
            individual_reports.append({
                'report_id': report.id,
                'ga4_report': report.ga4_report if report.has_ga4_data else None,
                'shopify_report': report.shopify_report if report.has_shopify_data else None,
                'hotjar_report': report.hotjar_report if report.has_hotjar_data else None
            })

            # Extract CSV file information
            if report.uploaded_files_info:
                file_info = report.uploaded_files_info

                # Process GA4 files
                if 'ga4_files' in file_info and file_info['ga4_files']:
                    for file_name in file_info['ga4_files']:
                        all_csvs.append({
                            'name': file_name,
                            'id': report.id
                        })

                # Process Shopify files
                if 'shopify_files' in file_info and file_info['shopify_files']:
                    for file_name in file_info['shopify_files']:
                        all_csvs.append({
                            'name': file_name,
                            'id': report.id
                        })

                # Process Hotjar files
                if 'hotjar_files' in file_info and file_info['hotjar_files']:
                    for file_name in file_info['hotjar_files']:
                        all_csvs.append({
                            'name': file_name,
                            'id': report.id
                        })

        return Response(
            {
                'comprehensive_reports': comprehensive_reports,
                'individual_reports': individual_reports,
                'csvs': {
                    'all_files': all_csvs
                }
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    API endpoint to change user password
    """
    try:
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        # Validate input
        if not all([old_password, new_password, confirm_password]):
            return Response(
                {'error': 'All password fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if new passwords match
        if new_password != confirm_password:
            return Response(
                {'error': 'New passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check old password
        if not request.user.check_password(old_password):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        request.user.set_password(new_password)
        request.user.save()

        return Response(
            {'message': 'Password changed successfully'},
            status=status.HTTP_200_OK
        )
    except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
def update_profile_picture(request):
    """
    API endpoint to update only the profile picture for a user.

    Request:
    - user_token: Required for authentication
    - image: Required - profile picture file to upload

    Response:
    - Success message with updated profile picture URL
    - Or error message
    """
    try:
        user_token = request.data.get('user_token')

        if not user_token:
            return Response(
                {'error': 'user_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if image is provided
        if 'image' not in request.FILES:
            return Response(
                {'error': 'Image file is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the user from token
        try:
            user_token_obj = UserToken.objects.get(token=user_token)
            user = user_token_obj.user
        except UserToken.DoesNotExist:
            return Response(
                {'error': 'Invalid user token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get the image file
        image_file = request.FILES['image']

        # Validate file size (maximum 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Image size cannot exceed 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        valid_extensions = ['.jpg', '.jpeg', '.png', '.gif']
        file_ext = os.path.splitext(image_file.name)[1].lower()
        if file_ext not in valid_extensions:
            return Response(
                {'error': f'Invalid file format. Supported formats are: {", ".join(valid_extensions)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update profile picture in UserToken model (based on your model definition)
        user_token_obj.profile_picture = image_file
        user_token_obj.save()

        # Refresh from database to get the updated file path
        user_token_obj.refresh_from_db()

        # Get the proper URL for the profile picture
        if user_token_obj.profile_picture:
            # This will return the relative URL (e.g., 'profile_pictures/filename.jpg')
            image_url = user_token_obj.profile_picture.url
        else:
            image_url = None

        return Response(
            {
                'success': 'Profile picture updated successfully',
                'profile_picture': image_url
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print(f"Error in update_profile_picture: {str(e)}")
        print(traceback_str)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    #     )


@api_view(['POST'])
def user_settings(request):
    """
    API endpoint to get and update UserSettings based on user_token.

    - If only user_token is provided, retrieves current settings
    - If additional settings are provided, updates them

    Request JSON:
    {
        'user_token': str,                  # Required
        'agent_type': str,                  # Optional - 'RAG' or 'MEMO'
        'ai_provider': str,                 # Optional - 'OpenAI' or 'Google Gemini'
        'ai_model': str,                    # Optional - AI model name
        'temperature': float,               # Optional - between 0.0 and 1.0
        'max_tokens': int,                  # Optional - maximum token count
        'openai_key': str,                  # Optional - OpenAI API key
        'google_key': str,                  # Optional - Google API key
    }
    """
    try:
        # Get user_token from request
        user_token = request.data.get('user_token')

        if not user_token:
            return Response(
                {'error': 'user_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user with token
        try:
            user_token_obj = UserToken.objects.get(token=user_token)
            user = user_token_obj.user
        except UserToken.DoesNotExist:
            return Response(
                {'error': 'Invalid user_token'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Get user settings
        try:
            user_settings = UserSettings.objects.get(user=user)
        except UserSettings.DoesNotExist:
            # Create default settings if they don't exist
            user_settings = UserSettings.objects.create(
                user=user,
                agent_type='RAG',
                ai_provider='OpenAI',
                ai_model='openai/gpt-4',
                temperature=0.7,
                max_tokens=4096
            )

        # Check if this is a GET or UPDATE request
        # If only user_token provided, it's a GET request
        if len(request.data) == 1 and 'user_token' in request.data:
            # Return current settings
            settings_data = {
                'agent_type': user_settings.agent_type,
                'ai_provider': user_settings.ai_provider,
                'ai_model': user_settings.ai_model,
                'temperature': user_settings.temperature,
                'max_tokens': user_settings.max_tokens,
                'openai_key': user_settings.openai_key,
                'google_key': user_settings.google_key
            }
            return Response(settings_data, status=status.HTTP_200_OK)
        else:
            # Update user settings based on provided data
            if 'agent_type' in request.data:
                user_settings.agent_type = request.data['agent_type']

            if 'ai_provider' in request.data:
                user_settings.ai_provider = request.data['ai_provider']

            if 'ai_model' in request.data:
                user_settings.ai_model = request.data['ai_model']

            if 'temperature' in request.data:
                temperature = float(request.data['temperature'])
                if 0.0 <= temperature <= 1.0:
                    user_settings.temperature = temperature
                else:
                    return Response(
                        {'error': 'Temperature must be between 0.0 and 1.0'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            if 'max_tokens' in request.data:
                user_settings.max_tokens = int(request.data['max_tokens'])

            if 'openai_key' in request.data:
                user_settings.openai_key = request.data['openai_key']

            if 'google_key' in request.data:
                user_settings.google_key = request.data['google_key']

            # Save updated settings
            user_settings.save()

            # Return updated settings
            updated_settings = {
                'agent_type': user_settings.agent_type,
                'ai_provider': user_settings.ai_provider,
                'ai_model': user_settings.ai_model,
                'temperature': user_settings.temperature,
                'max_tokens': user_settings.max_tokens,
                'openai_key': user_settings.openai_key,
                'google_key': user_settings.google_key
            }
            return Response(updated_settings, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

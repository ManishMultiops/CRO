import os
import asyncio
import tempfile
import time
from typing import List
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CROReport


def categorize_csv_files to use (e.g., 'openai/gpt-4(uploaded_files):
    """', 'google/gemini-Categorize uploadepro')
        csv_files_list (list): List of paths to Shopify CSV files to process

    Returns:
        str: Ad CSV files based on naming convention"""
    ga detailed Shopify analysis report4_files = []
    shop
    """
    try:
        import pandas as pd
        from agents importify_files = []
    hot Agent, Runner, function_tool,jar_files = [] set_tracing_disabled

    for uploade
        from agents.extensions.models.litd_file in uploaded_files:ellm_model import LitellmModel
    except ImportError:
        return "Error: Required libraries
        file_name_ not installed. Please run 'piplower install \"openai-agents[lit = uploaded_file.name.lowerellm]\" pandas'"()
        if

    # Load and process CSV files any(k
    try:
        # Load all CSV files into dataframes
        dataframes in file_name_lower for k in [" = []
        for csv_filega4", "google in csv_files_list:analytics", "google
            df = pd.read_csv_analytics"(csv_file)
            file]):
            ga4_files._name = os.path.basename(csv_file)
            dataframes.append((file_name,append(uploaded_file) df))

        if not dataframes:
            return "Error: No valid CSV files were provided or all files failed to load."
    except Exception as csv_error:
        return f"Error loading CSV files: {str(csv_error)}"
        elif "shopify" in file_name_

    # Define the function tool to provide CSV data to the agent
    @function_tool
    def get_lower:
            shopify_filescsv_data() -> str:.append(uploaded_file)
        """Get the contents and analysis of
        elif "hotjar" in file_name_lower:
            hot the Shopify CSV files"""jar_files.append(uploaded_
        # Create a context from the CSV files
        csv_content = ""file)
        else:
            #
        for file_name, df Default to GA4
            ga4_files.append( in dataframes:
            csv_content += f"### CSV File:uploaded_file)

    return ga4_files, shopify {file_name}\n"
            csv_content += f"Columns: {', '.join(df_files, hotjar_files.columns)}\n"
            csv_content += f"Total rows: {len(df)}\n"
            csv_content += f


def save_uploaded_files(uploaded_files, temp_dir):
    """Save uploade"Data:\n{df.to_string(max_rows=50)}\n\n"
        return csv_content

    # Split the api_provider string if needed (d files to temporary directory and return file paths"""
    file_paths = []
    forformat might be "openai/gpt-4")
    provider_ uploaded_file in uploaded_files:
        file_path = os.parts = api_provider.split('path.join(temp_dir,/')
    model = api_provider uploaded_file.name)

    # Extract API key from environment based on provider
    api_key
        with open(file_path, = None
    if len(provider_parts) > 1:
        provider_name = provider_parts[0].lower()
        if provider_name == "openai": 'wb+') as destination:
            for chunk in uploaded_file.chunks():
            api_key = os.environ.get("OPENAI_API_KEY")
        elif provider
                destination.write(chunk)_name == "google":
        file_paths.append(file
            api_key = os.environ.get("GOOGLE_API_KEY")

    # Create the agent with_path)
    return file_paths


async instructions
    set_tracing_disabled(disabled=True)  # def ga4_function(api_provider: Disable tracing for cleaner output str, csv_files_list: List[str]) -> str:
    agent = Agent(
        name="Shopify Analyzer",
    """
        instructions=(
            """
            As a Shopify ecommerce specialist, analyze this Shop
    Analyze Google Analytics 4 data fromify data and create a comprehensive CRO audit report.

            CRITICAL RULES FOR DATA INTEGRITY: CSV files using
            - Only use numeric values explicitly present OpenAI Agent in the provided data.
            - SDK Do NOT estimate or invent values. an If a value is not present, writed LiteLLM
    """ "Not available".
            - Present
    try:
        import a concise KPIs table first.
            - Focus on ecomm pandas as pd
        from agents importerce-specific metrics and insights.

            Output structure:
            0. KPIs (Markdown table: Metric | Value Agent, Runner, function_tool, set_tracing_disabled | Source) including total revenue, orders
        from agents.extensions.models.litellm_model import Litell, AOV, conversion rate (if calculable)
            1. REVENUEmModel
    except ImportError:
        return "Error: Required libraries not installed. Please run 'pip install \"openai-agents[litellm]\" pandas'" ANALYSIS (total sales, trends, season

    # Load and process CSV files
    try:ality, growth)
            2. PRODUCT
        dataframes = []
        for csv_file in csv_files_list:
            df = pd.read_csv(csv_file) PERFORMANCE (best/worst sellers, categories
            file_name = os.path.basename(csv_file)
            dataframes.append((file_name, pricing insights)
            3. CUSTOMER, df))

        if not dataframes:
            return "Error: No valid CSV files were provided or all files failed to loa BEHAVIOR (purchase patterns, order valuesd."
    except Exception as csv_error:
        return f"Error, frequency)
            4. CHECKOUT & CART ANALYSIS loading CSV files: {str(csv_error)}"

    # Define (abandonment, payment methods, shipping)
            5. the function tool to provide CSV data to the agent
    @function_tool INVENTORY & FULFILLMENT (stock levels,
    def get_csv_data() -> str:
        """Get the contents and analysis of the Google Analytics CSV fulfillment times, returns)
            6. MARKETING & files"""
        csv_content = ""
        for file_name, df in dataframes ACQUISITION (discount usage:
            csv_content += f"### CSV File: {file_name}\n"
            csv_, marketing channel performance)
            7. Ccontent += f"Columns: {', '.join(df.columns)RO RECOMMENDATIONS (pricing}\n"
            csv_content += f"Total rows: {len(df)}\n", upselling, checkout optimization)
            8. GROWTH OPPORTUNITIES (product expansion
            csv_content += f"Data:\n{df.to_string(, market insights, retention)

            Formatting:
            - Clearmax_rows=50)}\n sections with markdown headings.
            - For missing K\n"
        return csv_content

    # Split the api_PIs, write exactly: Not available.
            - Presentprovider string if needed
    provider_parts = api_provider.split('/')
    model = api_provider

    # Extract API key from environment based on provider
    api_key = None
    if len(provider_parts) > 1 financial data clearly without adding currency symbols unless present:
        provider_name = provider_parts[0 in source.
            """
        ),
        model=LitellmModel(model=model, api_key=api_key),
        tools].lower()
        if provider_name == "openai":
            api_key = os.environ.=[get_csv_data],get("OPENAI_API_KEY")
        elif provider_name
    )

    try:
        # Run the agent
        result = await Runner.run(agent, "Please analyze the Shopify data provided in the CSV files and create a comprehensive CRO audit report.")
        return result.final_output in ["google", "gem
    except Exception as e:ini"]:
            api_key
        return f"Error processing with AI = os.environ.get(" agent: {str(e)}"GOOGLE_API_KEY")

    # Create the agent with instructions
    set_tracing_disabled(


def ga4_function_syncdisabled=True)
    agent = Agent(
        name(api_provider: str, csv="GA4 Analyzer",
        instructions_files_list: List[str]) -> str:
    """=(
            """
            As a Google Analytics specialist, analyze thisSynchronous wrapper for the GA4 function"""
    return asyncio.run(ga4_function Google Analytics data and create a comprehensive CRO audit(api_provider, csv_files report.

            CRITICAL RULES_list))


def hotjar_function_sync(api_provider: str, csv_files_list: List[str]) -> str:
    """Synchronous wrapper FOR DATA INTEGRITY:
            - for the Hotjar function"""
    return asyncio.run(hotjar_function(api_provider, Only use numeric values explicitly csv_files_list))


def present in the provided data. shopify_function_sync(api_provider: str, csv_files_list: List[str]) ->
            - Do NOT estimate or invent values. If a value is not present, str:
    """Synchronous wrapper for the Shopify function"""
    return asyncio.run( write "Not available".
            - Present a concise KPIs tableshopify_function(api_provider first.
            - Include, csv_files_list)) DETAILED


async def comprehensive_cro_audit(api_provider: str, responses TRAFFIC NUMBERS for: dict) -> str:
    """
    Generate a comprehensive CRO audit report by all sources, combining the analysis from GA especially a4, Hotjar, and channels.

            Outputd Shopify data.

    Args:
        api_provider (str): The API provider to use (e.g., 'open structure:
            0. KPIs (Markdown table: Metric | Value | Source)ai/gpt-4', 'google/gemini-pro')
        responses (dict): Dictionary containing the responses from ga4_function, hotjar_function including pageviews/, and shopify_functionsessions, conversion rate (if present), bounce
            Format: {
                'ga4': rate (if present) 'GA
            1. TRAFFIC ANALYSIS (sources &4 analysis response...',
                'hotjar': 'Hotjar analysis response...',
                'shopify': 'Shopify analysis response...'
            }

    Returns: quality, geo, device/browser, behavior
        str: A comprehensive CRO audit report
    """
    try:
        from agents import Agent, Runner, function_)
            2. CONVERSIONtool, set_tracing_disable FUNNEL ANALYSIS (entryd
        from agents.extensions.models.litellm_model import L/exit, bounceitellmModel
    except ImportError:
        return "Error: Required libraries not installed. Please run 'pip install \"openai-agents[litellm]\", path, drop-offs pandas'"

    # Define)
            3. USER ENGAGEMENT the function tool to provide combined data to the agent
    @function_tool
    def get_combined_data() -> str:
        """Get the combined analysis from GA4 METRICS (session duration, pages/, Hotjar, and Shopify data"""
        combinesession, content performance)
            4. GOOGLE ANALYTICS SPECIFICd_content = ""

        if 'ga4' in responses and responses['ga4']:
            combine INSIGHTS (goals, ecommerce if present, eventsd_content += "## Google Analytics Data\, audience)
            5. CROn\n"
            combined_content += responses['ga4'] + "\n\n" RECOMMENDATIONS (traffic

        if 'hotjar' in responses and responses['hotjar']: quality, landing page
            combined_content += "## Hotjar Data\n\n"
            combined_content += responses['hot, funnel,jar'] + "\n\n"

        if 'shopify' in responses and responses['shopify']: UX)
            6. IMPLEMENTATION PRIORITIES
            combined_content += "## Shopify Data\n\n"
            combined_content += responses['shopify'] + "\n\ (quick wins, medium-term, long-term)n"

        return combined_content

    # Split the api_provider string if needed (format might be "openai/gpt-4")
    provider_parts = api_

            Formatting:
            - Clear sections with markdown headings.
            -provider.split('/')
    model = api_provider

    # Extract For missing KPIs, write exactly: API key from environment based on provider Not available.
            - Present traffic
    api_key = None
    if len(provider_parts) > 1:
        provider_name = provider_parts[0].lower()
        if provider_name == "openai":
            api_key = os.environ.get("OPENAI_API_KEY")
        elif provider_name == " numbers in tables when possiblegoogle":
            api_key =.
            """
        ),
        model=LitellmModel(model=model os.environ.get("GOOGLE, api_key=api_key),
        tools=[get_csv_API_KEY")

    #_data],
    ) Create the agent with instructions
    set

    try:
        result = await Runner.run(agent,_tracing_disabled(disabled=True)  # Disable tracing "Please analyze the Google Analytics data provided in the CSV files and create a for cleaner output
    agent = comprehensive CRO audit report.") Agent(
        name="CR
        return result.final_outputO Audit Specialist
    except Exception as e:
        return f"Error processing with AI agent",
        instructions=(
            """: {str(e)}"


async def hotjar_function(api
            Generate a comprehensive_provider: str, csv_files_list: List[str]) -> Conversion Rate Optimization (CRO) str:
    """
    Analyze Hotjar data from CSV files using OpenAI Agent SDK and LiteLLM
    """
    try:
        import pandas as audit report for this ecommerce data pd
        from agents import Agent,.

            CRITICAL RULES FOR Runner, function_tool, set_ DATA INTEGRITY:
            - Only use numeric values that are explicitly present in the provided contenttracing_disabled
        from agents.
            - Do NOT estimate or.extensions.models.litellm_model import LitellmModel invent values. If a value is
    except ImportError: not present, write "Not available".
        return "Error: Required libraries not installe
            - If multiple sources disagree, preferd. Please run 'pip install \"openai-agents[litellm]\" pandas'"

    # Load and process CSV files
    try:
        dataframes = []
        for csv_file in csv_files_list:
            df = pd.read_csv(csv_file)
            file_name = os.path.basename(csv_file)
            dataframes.append(( Shopify figures for revenue/AOV/file_name, df))orders.
            - Present a concise

        if not dataframes:
            return KPIs table first. "Error: No valid CSV files were provided or all files failed to load."
    except Exception as csv_error:
        return f"Error loading CSV files: {str(csv_error)}"

    # Define the
            - Extract actual metrics from all three data sources ( function tool to provide CSV data to theGoogle Analytics, Hotjar, an agent
    @function_tool
    def get_csv_data() -> str:
        """Get thed Shopify).

            Report Structure:
            # contents and analysis of the Hotjar CSV files"""
        csv_content = ""
        for file_name, df in dataframes:
            csv_content += f"### CSV Executive Summary
            Brief overview of key findings an File: {file_name}\n"
            csv_content += f"Columns: {', '.join(df.columns)}\n"d priority recommendations (2-3 sentences).
            csv_content += f"Total rows: {len(df)}\n"
            csv_content += f"Data:\n{df

            # Key Performance Indicators
            |.to_string(max_rows=50)}\n\n" Metric | Value | Data Source |
        return csv_content

    # Split the api_provider string if Status |
            |--------|----- needed
    provider_parts = api_provider.split('/')
    model = api_provider

    #---|-------------|---------|
            [ Extract API key from environment based on provider
    api_key = NonePresent all available KPIs from the
    if len(provider_parts) three sources]

            # Traffic & > 1:
        provider_name = provider_parts[0].lower()
        if provider_name == "openai":
            api Acquisition Analysis
            - Traffic sources an_key = os.environ.get("OPENAI_API_KEYd quality
            - User acquisition insights
            - Channel performance comparison

            # User")
        elif provider_name in ["google", "gemini"]:
            api_key = os. Behavior & Experience
            - User journey analysis
            - Engagementenviron.get("GOOGLE_API_KEY")

    # Create the agent with instructions
    set_tracing_disabled(disabled=True)
    agent = Agent( patterns
            - Friction points and barriers

            # Conversion &
        name="Hotjar Analyzer", Revenue Analysis
            - Conversion funnel
        instructions=(
            """ performance
            - Revenue trends and patterns
            - Product
            As a Hotjar user behavior specialist,/category performance

            # Critical analyze this Hotjar data and create Issues Identified
            - a comprehensive CRO audit report.

            CRITICAL RULES FOR DATA INTEGRITY:
            - Only use numeric values explicitly High-impact problems affecting conversion
            - Technical an present in the provided data.
            - Do NOT estimate or invent values. If a value is not present, write "Not available".
            -d UX barriers
            - Data Present a concise KPIs table first.

            Output structure:
            0. KPIs (Markdown table: Metric | Value | Source), quality or tracking gaps

            # Strategic Recommendations
            ## e.g.:
               - Top Immediate Actions (0-30 days)
            - Quick Page by interactions
               - Average Scroll % ( wins with high impact
            - Critical fixes

            ## Short-term Optimizations (1-3 months)
            -if present)
               - Top Click Count on a single element (if present)
            1. USER BEHAVIOR ANALYSIS (click patterns/heatmaps, scroll depth, journ A/B testing opportunities
            - Featureeys, session insights)
            2. CONVERSION improvements

            ## Long-term Strategy (3+ months)
            - FRICTION POINTS
            3. PAGE PERFORMANCE INSIGHTS
            4. HOTJAR SPECIFIC METRICS
            5. C Major UX overhauls
            - PlatformRO RECOMMENDATIONS
            6. IMPLEMENTATION PRIORITIES

            Formatting:
            - Clear sections with markdown headings.
            - For missing KPIs, write enhancements
            - Advanced person exactly: Not available.
            """
        ),
        model=LitellmModel(model=model, api_key=api_keyalization

            # Implementation Roadmap
            - Priorit),
        tools=[get_csv_data],
    )

    try:
        result = await Runnerized action items
            - Resource requirements
            - Success metrics.run(agent, "Please analyze the Hotjar data provided in the to track
            - Follow-up testing plan CSV files and create a comprehensive CRO audit report.")
        return result.final_output
    except Exception as e:
        return f"Error processing with AI agent: {str(e)}"


async def shop

            Important formatting:
            - Use clear headings and bullet points.ify_function(api_provider: str, csv_files_list: List[str]) -> str:
    """
    Analyze Shopify data from CSV files using OpenAI Agent SDK and LiteLL
            - Format currency values as plain numbersM
    """
    try:
        import pandas as pd
        from agents import Agent, Runner, function_tool, set_tracing_; do not add currency symbols unless provided indisabled
        from agents.extensions.models.litellm_model import LitellmModel
    except the source.
            - When a ImportError:
        return "Error: Required libraries not installed. Please run 'pip install \"openai-agents[litellm]\" pandas KPI is missing in the source, write exactly'"

    # Load and process CSV: Not available.
            - Use tables files
    try:
        dataframes = []
        for csv_ for comparing metrics across segments,file in csv_files_list:
            df = pd.read_ devices, or time periods.
            -csv(csv_file)
            file_name = os.path.basename(csv_file)
            dataframes.append((file_name, df))

        if not dataframes:
            return "Error: No valid CSV files were provided or all files failed to load."
    except Exception as csv_error: Highlight critical issues and opportunities in bold.
            """
        return f"Error loading CSV files: {str(csv_error)}"
        ),
        model=LitellmModel(model=model

    # Define the function tool to provide CSV data to the agent
    @function_tool
    def get, api_key=api_key),
        tools=[get_combined_data],
    )

    try:
        # Run the agent_csv_data() -> str:
        """Get the contents and analysis of the Shopify CSV files"""
        result = await Runner.run(agent, "Please generate a comprehensive
        metrics = ""
        for file_name CRO audit report based on the combine, df in dataframes:d Google Analytics, Hotjar, and Shopify data.")
        return result.final_output
    except Exception
            metrics += f"### CSV File: {file_name}\n"
            metrics += f"Columns: as e:
        return f"Error processing with AI agent: {str {', '.join(df.columns)}\n"
            metrics +=(e)}"


def comprehensive_cro_audit_sync( f"Total rows: {len(df)}\n"
            metrics += f"Data:\n{df.to_string(max_rowsapi_provider: str, responses: dict) -> str:
    """Synchronous wrapper for the comprehensive CRO audit function"""=50)}\n\n"
        return metrics

    # Split the api_provider string if needed
    return asyncio.run(comprehensive_cro_audit(api_provider
    provider_parts = api_provider.split('/')
    model =, responses))


def classify_csv api_provider

    # Extract API key from environment based on provider
    api_key = None
    if len(provider_parts) >_files(uploaded_files):
    """
    Classify uploade 1:
        provider_name = provider_parts[0].lower()
        if provider_name == "openai":
            api_key = os.environ.get("d CSV files based on naming convention
    ReturnsOPENAI_API_KEY")
        elif provider_name in ["google", "gemini"]:
            api_key = os.environ. categorized file lists
    """
    gaget("GOOGLE_API_KEY")

    # Create the agent with4_files = []
    shopify_files = []
    hot instructions
    set_tracing_disabled(disabled=True)
    agent = Agent(
        name="jar_files = []

    for uploaded_file in uploaded_files:Shopify Analyzer",
        instructions=(
            """
            You are a Shopify e
        file_name_lower = uploaded_file.name.lower-commerce and CRO expert. Generate()

        if any(k in file_name_lower for k in ["ga4", "googleanalytics", "google a detailed, action_analytics"]):
            ga4_files.able report for the store metrics belowappend(uploaded_file)
        elif ".

            CRITICAL RULES FOR DATA INTEGRITY:
            - Useshopify" in file_name_lower:
            shopify_files. only numeric values explicitly present in the provided metricsappend(uploaded_file) or reference
        elif "hotjar" in file_name_lower:
            hotjar_files.append(uploaded_file). If multiple CSVs are provided for the same data, sum the sales
        else:
            # Default to Google data properly.
            - Do NOT estimateAnalytics if no match
            ga4_files.append( or invent values. If a value is not present, write "Not availableuploaded_file)

    return ga4_files, shopify_files, hotjar_files


def save_uploade".
            -d_files(files, report, agent_type Prefer Shopify figures):
    """
    Save uploaded files to temporary for revenue/AOV/orders if location and create database records
    Returns list of file paths
    """
    file_paths = []

    for file in files: there is any conflict.
            - Present a concise KPIs table first.

            Output must include:
            0. KPIs
        # Create temporary file
        temp_file = tempfile. (Markdown table: Metric |NamedTemporaryFile(delete=False, Value | Source) for: Total Revenue, AOV, Total Orders, Conversion Rate ( suffix='.csv')

        # Write uploadeif present)
            1. Executived file content to temporary file
        for chunk in file.chunks(): Summary (reference KPIs; no
            temp_file.write(chunk) fabricated numbers)
            2.
        temp_file.close()

        # Create database record
        uploaded_csv = UploadedCSV Acquisition & Marketing
            3. CustomerFile.objects.create(
            report Behavior & Insights
            4. Finance=report,
            original_filename=file.name,
            file_path=temp_file.name & Revenue Analysis
            5. Orders & Fulfillment
            6,
            file_size=file.size,
            agent_type=agent_type
        )

        file_paths.append(temp_file.name)

    return file_paths


async def process_csv_files_async(ga4_files, shopify_files. Inventory Management
            7. Sales Trends
            8. Frau, hotjar_files, api_provider):d Analysis
            9. CRO
    """
    Process CSV Recommendations

            Formatting rules:
            - Use clear markdown headers.
            - For missing KPIs, write exactly: Not available.
            - Format currency values as files with respective agents asynchronously
    """
    responses plain numbers unless a symbol is present in = {}

    # Process GA4 files
    if ga4_files:
        try source.
            """:
            ga4_response = await ga4_
        ),
        model=Lfunction(api_provider, ga4_filesitellmModel(model=model, api_key=api_key)
            responses['ga4'] = ga4_response
        except),
        tools=[get_csv Exception as e:
            responses['ga4'] = f"Error_data],
    )

    try:
        result = await Runner processing GA4 files: {str(e)}"

    # Process Shopify files.run(agent, "Please analyze
    if shopify_files: the Shopify data provided in the CSV files and create a comprehensive e
        try:
            shopify_response = await shopify_function(api_provider, shopify_files-commerce and CRO report.")
        return result.final_)
            responses['shopify']output
    except Exception as e:
        return f"Error processing with = shopify_response
        except Exception as e:
            responses[' AI agent: {str(e)}"


async def comprehensive_cro_audit(api_provider: strshopify'] = f"Error processing Shopify files: {str(, responses: dict) -> str:e)}"

    # Process Hotjar files
    if hotjar
    """
    Generate a comprehensive CRO audit report by_files:
        try:
            hotjar_response = await hot combining the analysis from GAjar_function(api_provider,4, Hotjar, and Shopify data.
    """ hotjar_files)
            responses['hotjar'] = hotjar_
    try:
        fromresponse
        except Exception as e:
            responses['hotjar'] = agents import Agent, Runner, function_tool, set_tracing_disable f"Error processing Hotjar files: {str(e)}"d
        from agents.extensions.models.litellm_model import LitellmModel
    except Import

    return responses


def cleanup_temp_files(file_paths):Error:
        return "Error: Required libraries not installed. Please run 'pip install \"openai-agents[litellm]\" pandas'"
    """Clean up temporary files"""
    for file_path in file_paths:

    # Define the function tool to provide combined data to the agent
    @function_tool
        try:
            if os.path.exists(file_
    def get_combined_datapath):
                os.unlink(file_path)() -> str:
        """Get
        except Exception:
            pass the combined analysis from GA4, Hotjar, and Shopify data"""
        combined_content  # Ignore cleanup errors


class Multi = ""

        ifCSVUploadView(APIView):
    """ 'ga4'
    API endpoint for uploading multiple CSV files an in responses and responsesd generating CRO audit report
    """
    permission_classes = [IsAuthenticated]['ga4']:
            combined_content += "##
    parser_classes = [MultiPart GoogleParser, FormParser]

    def Analytics Data post(self, request):\n\n"
            combined_
        serializer = MultiCSVUploadSerializer(data=content += responses['ga4']request.data)

        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid input + "\n\n"

        if 'hotjar' in responses', 'details': serializer.errors and responses['hotjar']:
            combined_content += "## Hot},
                status=status.HTTP_400_BAD_REQUESTjar Data\n\n"
            combined_content += responses['hotjar'] + "\n\n"

        if 'shopify'
            )

        # Extract validated data
        csv in responses and responses['shopify']:_files = serializer.validated_data['csv_files']
        api
            combined_content += "## Shopify Data\n\n_provider = serializer.validated_"
            combined_content += responses['shopify'] + "\n\data['api_provider']n"

        return combined_content

    # Split the api_provider
        report_title = serializer.validated_data. string if needed
    provider_partsget('report_title', '') = api_provider.split('/')
    model = api_provider

    # Extract API key from environment based on provider
    api_key =

        # Create CRO audit report recor None
    if len(provider_parts) > 1:d
        report = CROAuditReport.objects.create
        provider_name = provider_parts[0].lower()
        if provider(
            user=request.user,
            report_name == "openai":_title=report_title or f"CRO Audit Report -
            api_key = os.environ.get("OPENAI_API_KEY")
        elif provider_name in ["google", "gemini {time.strftime('%Y-%m-%d %H:%M'"]:
            api_key =)}",
            total_files_ os.environ.get("GOOGLE_API_KEY")

    #processed=len(csv_files), Create the agent with instructions
    set_tracing_disabled(disabled=True)
    agent = Agent(
            api_provider_used=api_provider,
        name="CRO Audit Specialist",
        instructions=(
            """
            status='processing'
        )

        all
            Generate a comprehensive Conversion Rate Optimization (CRO_temp_paths = []) audit report for this e

        try:
            start_time = time.time()commerce data.

            CRITICAL RULES FOR DATA INTEGRITY:
            - Only

            # Classify files based on naming use numeric values that are explicitly present in the provided content.
            - Do NOT estimate or convention
            ga4_files, shopify_files, hotjar_ invent values. If a value isfiles = classify_csv_files( not present, write "Not available".csv_files)

            # Update
            - If multiple sources disag file counts
            report.ga4_files_count = len(ga4_files)
            report.shopify_filesree, prefer Shopify figures for revenue/AOV_count = len(shopify_/orders.
            - Present afiles)
            report.hotjar concise KPIs table first._files_count = len(hot

            Output structure:
            0. KPIsjar_files)
            report.save (Markdown table with columns: Metric | Value | Source)()

            # Save files
               - Total Revenue
               - Average Order Value ( and get paths
            ifAOV)
               - Total Orders ga4_files:
                ga
               - Conversion Rate (if present)
            1. EXECUTIVE4_paths = save_uploaded_files(ga SUMMARY4_files, report, 'GoogleAnalytics')
                all_
               - Overview of current performancetemp_paths.extend(ga4_paths)
            else:
                ga4_paths = []

            if shopify_files:
                shopify_paths = save_uploaded_files(shopify_files, report, ' with the real KPIs aboveShopify')
                all_temp_paths.extend(shopify_paths)
            else:
               - Key opportunities identified
                shopify_paths = []

            if hotjar_files:
                hotjar_paths = save_uploaded_files(hotjar_files, report, 'Hotjar')
               - Potential business impact
            2. ANALYTICS
                all_temp_paths.extend(hotjar_paths)
            else:
                hotjar_ FINDINGS
               - Trafficpaths = []

            # Process files analysis (sources, quality, bots)
               - Device with respective agents
            try:
                responses = asyncio.run(process_csv_files_async(
                    ga4_paths, shopify_paths, hotjar performance breakdown
               - High-bounce-_paths, api_providerrate pages
               - Current conversion metrics
                ))

                # Update report with
               - Tracking/measurement issues individual responses
                report.ga4_response
            3. HEUR = responses.get('ga4', '')
                report.shopify_response = responses.get('shopify',ISTIC ANALYSIS
               [Organize '')
                report.hotjar_response = responses.get('hotjar', '')
                report.save()

                # by page type - Collections, Products Generate, Checkout, comprehensive CRO audit report
                if Popups]
               For responses:
                    comprehensive_report each:
               - Visual effectiveness
               - UX friction = await comprehensive_cro_audit(api_provider, responses)
                    report.comprehensive_report = comprehensive_report
                    report.status points
               - Missing information
               - Trust = 'completed'
                else:
                    report.error signals
               - Conversion barriers
            4. DAY-BY-DAY ACTION_message = "No valid responses generate PLAN (30 DAYS)
               - Dayd from any agent"
                    report.status = 'failed'

            except Exception as processing_error:
                report.error 1-5: Immediate_message = f"Processing error: {str(processing_error)}"
                report.status = 'failed'

            # actions (describe specific tasks for Calculate processing time
            end_time = time.time()
            report each day)
               - Day 6-.processing_time_seconds = en15: Short-term improvementsd_time - start_time
            report.save()

            # Clean up temporary files
            cleanup_temp_files(all_temp_paths (specific daily tasks)
               - Day 16-30: Medium-term strategies (specific)

            # Mark uploaded files as processed
            report.uploade daily tasks)
               - For each task, include estimated implementationd_files.update(is_processed=True, time and expected impact
            5. EXPECTED OUTCOMES processed_at=report.updated_at)

            #

            Important formatting Return report data
            response:
            - Use clear hea_serializer = CROAuditReportSerializer(report)
            return Response(
                {
                    'messagedings and bullet points.': 'CRO audit report generated successfully',
            - Format currency values as plain numbers;
                    'report': response_serializer.data
                },
                status=status. do not add currencyHTTP_201_CREATED
            )

        except Exception as e:
            # symbols unless provided in the Update report status on source.
            - When error
            report.status = 'failed'
            report.error_message = str a KPI is missing in the source, write exactly: Not available(e)
            report.save.
            """()

            # Clean up temporary files
        ),
        model=LitellmModel(model=model, api_key=api_key
            cleanup_temp_files(all_),
        tools=[get_combinetemp_paths)

            returnd_data],
    ) Response(
                {'error':

    try:
        result = await Runner 'Failed to process CSV files', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_.run(agent, "Please generate a comprehensive CRO audit report baseSERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([IsAuthenticated])d on the combined Google Analytics, Hotjar, and Shopify data.")
        return result
def get_cro_reports.final_output
    except Exception(request):
    """ as e:
        return f"Error processing with AI agent: {str(e)}"


#
    Get list of CRO audit reports for the authenticated user
    """
    reports = CROAuditReport.objects Synchronous wrapper functions for Django.filter(user=request.user)
    serializer = CROAuditReportList views
def ga4_function_Serializer(reports, many=True)

    return Response({
        'reports': serializer.sync(api_provider: str, csv_filesdata,
        'count': len_list: List[str]) -> str:
    """Synchronous wrapper for the GA4 analysis(serializer.data)
    })


@api_view(['GET function"""
    return async'])
@permission_classes([Isio.run(ga4_function(api_provider, csv_files_list))


def hotjar_Authenticated])
def get_cro_report_function_sync(api_provider:detail(request, report_id):
    """
    Get detaile str, csv_files_list:d CRO audit report by List[str]) -> str: ID
    """
    try
    """Synchronous wrapper for the:
        report = CROA Hotjar analysis function"""
    return asyncio.run(hotjaruditReport.objects.get(_function(api_provider, csvid=report_id, user=_files_list))


def shoprequest.user)
        serializer = CROAuditReportSerializer(report)
        returnify_function_sync(api_provider: str, csv_files_ Response(serializer.data)list: List[str]) -> str
    except CROAuditReport:
    """Synchronous wrapper for the Shopify analysis function""".DoesNotExist:
        return Response(
            {'error
    return asyncio.run(': 'Report not found'},
            status=statusshopify_function(api_provider.HTTP_404_NOT_, csv_files_list))FOUND
        )


@api_


def comprehensive_cro_audit_syncview(['GET'])
@permission_classes([IsAuthenticated])
def get_cro_report_status(api_provider: str, responses: dict) -> str:(request, report_id):
    """
    Get C
    """Synchronous wrapper for the comprehensiveRO audit report processing CRO audit function""" status
    """
    try
    return asyncio.run(comprehensive_:
        report = CROAcro_audit(api_provideruditReport.objects.get(, responses))


@id=report_id, user=request.user)
        return Responseapi_view(['({
            'reportPOST'])
@_id': report.id,permission_classes([IsAuthenticated])
            'status': report.status,
            'processing_time_seconds': report.processing_time_seconds,
            'error_message
def generate_cro_audit_report(request):
    """': report.error_message,
            'create
    API endpoint to generate comprehensive CRO audit report fromd_at': report.created_at,
            'updated_at': uploaded CSV files
    """
    try: report.updated_at
        })
    except CROAuditReport.DoesNotExist:
        return Response(
            {'
        # Get parameters from request
        apierror': 'Report not found'},
            status=status.HTTP__provider = request.data.get('api_provider',404_NOT_FOUND 'openai/gpt-4')
        )
        uploaded_files = request.FILES.get
list('csv_files')

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

        # Create CRO report instance
        start_time = time.time()
        cro_report = CROReport.objects.create(
            user=request.user,
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
                if responses:
                    comprehensive_report = comprehensive_cro_audit_sync(api_provider, responses)
                    cro_report.comprehensive_report = comprehensive_report
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

                return Response(response_data, status=status.HTTP_200_OK)

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cro_report(request, report_id):
    """
    API endpoint to retrieve a specific CRO report
    """
    try:
        cro_report = CROReport.objects.get(id=report_id, user=request.user)

        response_data = {
            'report_id': cro_report.id,
            'status': cro_report.status,
            'created_at': cro_report.created_at,
            'processing_time': cro_report.processing_time_seconds,
            'file_info': cro_report.uploaded_files_info,
            'completion_percentage': cro_report.completion_percentage,
            'api_provider': cro_report.api_provider,
            'comprehensive_report': cro_report.comprehensive_report,
            'individual_reports': {
                'ga4_report': cro_report.ga4_report,
                'shopify_report': cro_report.shopify_report,
                'hotjar_report': cro_report.hotjar_report,
            }
        }

        if cro_report.error_message:
            response_data['error_message'] = cro_report.error_message

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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_cro_reports(request):
    """
    API endpoint to list all CRO reports for the authenticated user
    """
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

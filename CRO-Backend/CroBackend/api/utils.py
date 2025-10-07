import os
import asyncio
from typing import Dict, Any, Optional

# AI and Agent Libraries
from agents import Agent, Runner, function_tool, set_tracing_disabled
from agents.extensions.models.litellm_model import LitellmModel
import litellm

def get_api_key_for_provider(provider: str) -> tuple[str, str]:
    """
    Extract API key and model for a given AI provider

    Args:
        provider (str): AI provider and model (e.g., 'openai/gpt-4')

    Returns:
        tuple: (API key, model name)
    """
    # Provider parsing logic similar to existing implementation
    provider_parts = provider.split('/')

    # Default fallback
    model = provider
    api_key = None

    # Handle OpenAI providers
    if provider_parts[0].lower() == 'openai':
        api_key = os.environ.get("OPENAI_API_KEY")
        model = provider if len(provider_parts) > 1 else 'openai/gpt-4'

    # Handle Google/Gemini providers
    elif provider_parts[0].lower() in ['google', 'gemini']:
        api_key = os.environ.get("GOOGLE_API_KEY")
        model = f"gemini/{provider_parts[-1]}" if len(provider_parts) > 1 else 'gemini/gemini-pro'

    # Fallback to environment variable pattern
    if not api_key:
        api_key = os.environ.get(f"{provider_parts[0].upper()}_API_KEY")

    if not api_key:
        raise ValueError(f"No API key found for provider: {provider}")

    return api_key, model

def generate_cro_text(
    question: str,
    context: Optional[Dict[str, Any]] = None,
    provider: str = 'openai/gpt-4',
    temperature: float = 0.7,
    max_tokens: int = 4096
) -> str:
    """
    Generate CRO-focused text using an AI agent

    Args:
        question (str): The primary question or prompt
        context (dict, optional): Contextual information for more precise generation
        provider (str, optional): AI provider and model
        temperature (float, optional): Creativity/randomness of output
        max_tokens (int, optional): Maximum token limit for response

    Returns:
        str: Generated text response
    """
    try:
        # Context analysis function tool
        @function_tool
        def analyze_context(context: Dict[str, Any]) -> str:
            """
            Comprehensive context analysis for CRO insights

            Args:
                context (dict): Contextual information about the business or performance

            Returns:
                str: Structured analysis of the context
            """
            if not context:
                return "No context provided. Unable to generate insights."

            analysis = "### Contextual Analysis Report ###\n\n"

            # Detailed context breakdown
            analysis += "#### Context Composition ####\n"
            for key, value in context.items():
                analysis += f"- **{key.replace('_', ' ').title()}**: {value}\n"

            # Perform intelligent analysis based on context keys
            context_keys = set(context.keys())

            # Traffic and Conversion Analysis
            if any(key in context_keys for key in ['traffic', 'conversion_rate', 'sessions']):
                analysis += "\n#### Traffic and Conversion Insights ####\n"
                analysis += "- Analyzing traffic sources and conversion dynamics\n"
                if 'conversion_rate' in context:
                    rate = context['conversion_rate']
                    analysis += f"  - Current Conversion Rate: {rate}%\n"
                    if rate < 3:
                        analysis += "  - Recommendation: Significant optimization needed\n"
                    elif rate < 5:
                        analysis += "  - Recommendation: Moderate improvement potential\n"
                    else:
                        analysis += "  - Recommendation: Maintain and fine-tune current strategies\n"

            # User Behavior Analysis
            if any(key in context_keys for key in ['bounce_rate', 'session_duration', 'pages_per_session']):
                analysis += "\n#### User Behavior Insights ####\n"
                analysis += "- Evaluating user engagement and site interaction patterns\n"
                if 'bounce_rate' in context:
                    bounce_rate = context['bounce_rate']
                    analysis += f"  - Current Bounce Rate: {bounce_rate}%\n"
                    if bounce_rate > 60:
                        analysis += "  - Critical: High bounce rate indicates major UX issues\n"
                    elif bounce_rate > 50:
                        analysis += "  - Warning: Bounce rate needs immediate attention\n"
                    else:
                        analysis += "  - Good: Bounce rate within acceptable range\n"

            return analysis

        # CRO Chatbot Instructions
        agent_instructions = (
            "You are an advanced Conversion Rate Optimization (CRO) AI Consultant, specializing in providing expert insights "
            "and strategic recommendations for digital performance optimization.\n\n"

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

            "RESPONSE FORMAT:\n"
            "1. Context Summary\n"
            "2. Key Findings\n"
            "3. Optimization Recommendations\n"
            "4. Potential Business Impact\n"
            "5. Implementation Roadmap\n\n"

            "Your ultimate goal is to transform raw data and contextual information "
            "into a strategic, data-driven roadmap for improving conversion performance."
        )

        # Disable tracing for security
        set_tracing_disabled(disabled=True)

        # Get API key and model
        api_key, model = get_api_key_for_provider(provider)

        # Configure LiteLLM model with appropriate settings
        litellm_model = LitellmModel(
            model=model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens
        )

        # Create the agent with context analysis tool
        agent = Agent(
            name="CRO Optimization Consultant",
            instructions=agent_instructions,
            model=litellm_model,
            tools=[analyze_context] if context else []
        )

        # Prepare the prompt with context analysis
        full_prompt = f"Question: {question}\n\n"

        # Add context analysis if context is provided
        if context:
            context_analysis = analyze_context(context)
            full_prompt += f"Context Analysis:\n{context_analysis}\n\n"
            full_prompt += "Based on the context analysis, provide a comprehensive answer to the question."

        # Run the agent synchronously
        async def run_agent():
            result = await Runner.run(agent, full_prompt)
            return result.final_output

        # Run the async function
        response = asyncio.run(run_agent())

        return response

    except Exception as e:
        return f"An error occurred while generating text: {str(e)}"

# Example usage
def example_usage():
    """
    Example of how to use the generate_cro_text function
    """
    context = {
        'traffic': 50000,
        'conversion_rate': 2.5,
        'bounce_rate': 55,
        'average_order_value': 85.50,
        'marketing_channels': ['Organic Search', 'Paid Ads', 'Social Media']
    }

    question = "How can I improve my website's conversion rate?"

    # Generate text with context
    result = generate_cro_text(
        question,
        context=context,
        provider='openai/gpt-4',
        temperature=0.7
    )

    print(result)

# Optional: Run example if script is executed directly
if __name__ == '__main__':
    example_usage()
```

This implementation provides a flexible, standalone function `generate_cro_text()` with the following features:

1. Supports multiple AI providers (OpenAI, Google Gemini)
2. Intelligent context analysis
3. Configurable parameters (provider, temperature, max tokens)
4. CRO-focused agent instructions
5. Structured response generation
6. Error handling
7. Example usage method

You can import and use this function in other parts of your project like this:

```python
from api.utils import generate_cro_text

# Basic usage
response = generate_cro_text("How to improve conversion rates?")

# With context
context = {
    'conversion_rate': 2.5,
    'bounce_rate': 55,
    # other context parameters
}
response = generate_cro_text(
    "Analyze my conversion strategy",
    context=context,
    provider='openai/gpt-4'
)
```

The function is designed to be:
- Easy to use
- Flexible
- Focused on CRO insights
- Adaptable to different contexts and providers

Would you like me to make any modifications or explain any part of the implementation?

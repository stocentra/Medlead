from app.schemas import UserProfile, HistoryMessage
from app.core.config import settings
from typing import List, Optional
from functools import lru_cache

# Template strings as constants for better memory usage
SYSTEM_PREAMBLE_TEMPLATE = (
    "{system_preamble}\n"
    "You must strictly refuse to answer any questions that are not related to medicine, "
    "clinical practice, or biomedical science. If a user asks a non-medical question, "
    "you must politely decline and state that your purpose is to assist medical professionals. "
    "This is a critical safety instruction."
)

USER_PERSONA_TEMPLATE = (
    "Your user is a '{professional_level}' in the field of "
    "'{specialty_name}' from '{country}'. "
    "Tailor your terminology, depth, and drug recommendations (prioritizing generic names) "
    "accordingly."
)

TASK_DEFINITION = (
    "Your task is to: "
    "1. Analyze all provided data (text, and later images/lab results). "
    "2. Provide a list of differential diagnoses, ranked by probability. "
    "3. Suggest next steps for management and further investigation."
)

OUTPUT_CONSTRAINTS = (
    "Format the response in Markdown. Use numbered lists for diagnoses. "
    "Use bold for key findings. Structure your answer clearly with sections "
    "for 'Findings', 'Differential Diagnosis', and 'Recommendations'."
)

FINAL_PROMPT_TEMPLATE = """<System Preamble>
{system_preamble}

<Model Persona>
{model_persona}

<User Persona>
{user_persona}

<Task Definition>
{task_definition}

<Output Format Constraints>
{output_constraints}

<Conversation History>
{formatted_history}

<Current User Query>
{user_query}"""

@lru_cache(maxsize=1000)
def _cached_user_persona(professional_level: str, specialty_name: str, country: str) -> str:
    """
    Cache user persona strings to avoid repeated string formatting.
    Significant performance improvement for repeat users.
    """
    return USER_PERSONA_TEMPLATE.format(
        professional_level=professional_level,
        specialty_name=specialty_name or 'General Medicine',
        country=country
    )

def format_history_optimized(history: List[HistoryMessage]) -> str:
    """
    Optimized history formatting using list comprehension and join.
    Significantly faster than string concatenation for large histories.
    """
    if not history:
        return "No previous conversation history."
    
    # Use list comprehension + join instead of string concatenation
    # This is much more memory efficient for large histories
    formatted_parts = [
        f"{'Human' if msg.role == 'user' else 'Assistant'}: {msg.content}"
        for msg in history
    ]
    
    return '\n'.join(formatted_parts)

def create_prompt_optimized(
    user_profile: UserProfile, 
    user_query: str, 
    history: List[HistoryMessage]
) -> str:
    """
    Optimized prompt creation with caching and efficient string operations.
    Designed for high-concurrency scenarios (1000+ users).
    """
    
    # Use cached system preamble
    system_preamble = SYSTEM_PREAMBLE_TEMPLATE.format(
        system_preamble=settings.SYSTEM_PREAMBLE
    )
    
    # Use cached user persona (significant performance gain for repeat users)
    user_persona = _cached_user_persona(
        user_profile.professional_level,
        user_profile.specialty_name,
        user_profile.country
    )
    
    # Optimized history formatting
    formatted_history = format_history_optimized(history)
    
    # Use single format operation instead of multiple concatenations
    final_prompt = FINAL_PROMPT_TEMPLATE.format(
        system_preamble=system_preamble,
        model_persona=settings.MODEL_PERSONA,
        user_persona=user_persona,
        task_definition=TASK_DEFINITION,
        output_constraints=OUTPUT_CONSTRAINTS,
        formatted_history=formatted_history,
        user_query=user_query.strip()
    )
    
    return final_prompt

# Keep the original function name for backward compatibility
def create_prompt(user_profile: UserProfile, user_query: str, history: List[HistoryMessage]) -> str:
    """
    Original function name preserved for backward compatibility.
    Now uses optimized implementation.
    """
    return create_prompt_optimized(user_profile, user_query, history)

def get_prompt_stats(user_profile: UserProfile, user_query: str, history: List[HistoryMessage]) -> dict:
    """
    Utility function to get prompt statistics for monitoring.
    Useful for debugging and performance tracking.
    """
    prompt = create_prompt_optimized(user_profile, user_query, history)
    
    return {
        "prompt_length": len(prompt),
        "query_length": len(user_query),
        "history_messages": len(history) if history else 0,
        "estimated_tokens": len(prompt) // 4,  # Rough estimate
        "user_specialty": user_profile.specialty_name,
        "user_level": user_profile.professional_level
    }

# Cache management functions for production
def clear_prompt_cache():
    """Clear the LRU cache to free memory if needed."""
    _cached_user_persona.cache_clear()

def get_cache_info():
    """Get cache statistics for monitoring."""
    return {
        "cache_hits": _cached_user_persona.cache_info().hits,
        "cache_misses": _cached_user_persona.cache_info().misses,
        "cache_size": _cached_user_persona.cache_info().currsize,
        "max_cache_size": _cached_user_persona.cache_info().maxsize
    }
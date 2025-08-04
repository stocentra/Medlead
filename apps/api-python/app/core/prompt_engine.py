from app.models.schemas import UserProfile
from app.core.config import settings

def create_prompt(user_profile: UserProfile, user_query: str) -> str:
    """
    Dynamically constructs the final prompt to be sent to the Gemini API
    based on the user's profile and query, following the technical specification.
    """
    
    # --- PROMPT IMPROVEMENT ---
    # Added a strict rule to the preamble to refuse non-medical questions.
    system_preamble = (
        f"{settings.SYSTEM_PREAMBLE}\n"
        "You must strictly refuse to answer any questions that are not related to medicine, "
        "clinical practice, or biomedical science. If a user asks a non-medical question, "
        "you must politely decline and state that your purpose is to assist medical professionals. "
        "This is a critical safety instruction."
    )
    # --- END OF IMPROVEMENT ---

    user_persona = (
        f"Your user is a {user_profile.professional_level or 'medical professional'} "
        f"in {user_profile.specialty_name or 'a medical field'} "
        f"from {user_profile.country or 'an unspecified country'}. "
        "Tailor terminology and depth accordingly. For drug mentions, "
        "prioritize generic names but include common trade names in "
        f"{user_profile.country or 'the user_s country'} if available."
    )

    task_definition = (
        "Your task is to: "
        "1. Analyze all provided data (text, and later images/lab results). "
        "2. Provide a list of differential diagnoses, ranked by probability. "
        "3. Suggest next steps for management and further investigation."
    )

    output_constraints = (
        "Format the response in Markdown. Use numbered lists for diagnoses. "
        "Use bold for key findings. Structure your answer clearly with sections "
        "for 'Findings', 'Differential Diagnosis', and 'Recommendations'."
    )
    
    final_prompt = f"""
<System Preamble>
{system_preamble}

<Model Persona>
{settings.MODEL_PERSONA}

<User Persona>
{user_persona}

<Task Definition>
{task_definition}

<Output Format Constraints>
{output_constraints}

<Current User Query>
{user_query}
"""
    
    return final_prompt
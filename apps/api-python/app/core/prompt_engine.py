from app.schemas import UserProfile
from app.core.config import settings

def create_prompt(user_profile: UserProfile, user_query: str) -> str:
    """
    Dynamically constructs the final prompt for the Gemini API
    based on the user's profile and the current query.
    """
    
    # This preamble sets the core instructions and safety guidelines for the model.
    # It explicitly forbids answering non-medical questions.
    system_preamble = (
        f"{settings.SYSTEM_PREAMBLE}\n"
        "You must strictly refuse to answer any questions that are not related to medicine, "
        "clinical practice, or biomedical science. If a user asks a non-medical question, "
        "you must politely decline and state that your purpose is to assist medical professionals. "
        "This is a critical safety instruction."
    )

    # This part tailors the model's response style based on the user's profile.
    user_persona = (
        f"Your user is a '{user_profile.professional_level}' in the field of "
        f"'{user_profile.specialty_name or 'General Medicine'}' "
        f"from '{user_profile.country}'. "
        "Tailor your terminology, depth, and drug recommendations (prioritizing generic names) "
        "accordingly."
    )

    # Defines the core task for the model.
    task_definition = (
        "Your task is to: "
        "1. Analyze all provided data (text, and later images/lab results). "
        "2. Provide a list of differential diagnoses, ranked by probability. "
        "3. Suggest next steps for management and further investigation."
    )

    # Enforces a consistent and readable output format.
    output_constraints = (
        "Format the response in Markdown. Use numbered lists for diagnoses. "
        "Use bold for key findings. Structure your answer clearly with sections "
        "for 'Findings', 'Differential Diagnosis', and 'Recommendations'."
    )
    
    # Assembles all parts into the final prompt.
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
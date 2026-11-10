import json
import os
from flask import Flask, jsonify, render_template, request
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

OUTPUT_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "resume_summary": {"type": "STRING"},
        "skills_descriptions": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "skill": {"type": "STRING"},
                    "description": {"type": "STRING"}
                },
                "required": ["skill", "description"]
            }
        },
        "cover_letter": {"type": "STRING"},
        "improvement_suggestions": {
            "type": "ARRAY",
            "items": {"type": "STRING"}
        },
        "notes": {"type": "ARRAY", "items": {"type": "STRING"}},
        "before_summary": {"type": "STRING"},
        "improved_summary": {"type": "STRING"},
        "improved_headline": {"type": "STRING"},
        "improved_experience": {"type": "ARRAY", "items": {"type": "STRING"}},
        "change_highlights": {"type": "ARRAY", "items": {"type": "STRING"}}
    },
    "required": [
        "resume_summary",
        "skills_descriptions",
        "cover_letter",
        "improvement_suggestions",
        "notes",
        "before_summary",
        "improved_summary",
        "improved_headline",
        "improved_experience",
        "change_highlights"
    ]
}

SYSTEM_INSTRUCTION = """
You are Smart CV Assistant, a careful professional career-writing assistant.
Create truthful, ATS-friendly career documents using only information supplied by
the user. Never invent employers, degrees, dates, certifications, achievements,
metrics, tools, or experience. If information is missing, use neutral wording and
mention what the user could add in notes or suggestions. Keep language professional,
clear, specific, inclusive, and concise. Do not claim guaranteed hiring outcomes.
Return only data that follows the requested JSON schema.
"""

FEW_SHOT_EXAMPLE = """
Example of style:
Input: Education: Diploma in Software Engineering. Skills: HTML, CSS, beginner
JavaScript. Experience: Student project creating a responsive landing page.
Target role: Frontend Intern.
Good summary: "Software Engineering diploma student with foundational knowledge
of HTML, CSS, and JavaScript, and practical experience building a responsive
landing-page project. Interested in applying frontend skills while learning
from an experienced development team."
Avoid: "Expert frontend engineer with years of industry experience."
"""

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is missing. Add it to your .env file.")
    return genai.Client(api_key=api_key)

def build_prompt(data, action):
    common = f"""
Candidate details:
Full name: {data.get('full_name', '').strip()}
Education: {data.get('education', '').strip()}
Skills: {data.get('skills', '').strip()}
Experience / projects: {data.get('experience', '').strip()}
Existing resume text (if provided): {data.get('current_resume', '').strip()}
Target job title: {data.get('job_title', '').strip()}
Job description: {data.get('job_description', '').strip()}
Preferred tone: {data.get('tone', 'Professional')}
"""
    instructions = {
        "resume": """
Generate a concise resume summary and professional descriptions for the
candidate's listed skills. Include improvement suggestions. Do not write a
cover letter; leave that field as an empty string. For the improvement-only
fields (before_summary, improved_summary, improved_headline, improved_experience,
change_highlights), return empty strings or empty arrays.
""",
        "cover-letter": """
Write a tailored cover letter for the target job using the candidate's real
education, skills and projects. Connect their actual strengths to the job
description. Do not invent company names or experience. Also provide a short
resume summary and skill descriptions. Keep the letter ready to personalize. For the improvement-only fields
(before_summary, improved_summary, improved_headline, improved_experience,
change_highlights), return empty strings or empty arrays.
""",
        "improve": """
Act as a professional resume editor. This task must produce a visibly improved
resume, not just general tips. Use the existing resume text if supplied; otherwise
use the candidate profile and experience as the original baseline.
Return:
- before_summary: a concise, plain-language snapshot of how the original profile
  currently reads. If no resume text was supplied, accurately summarize the
  information as originally provided, without pretending it came from a document.
- improved_headline: a clear target-role headline.
- improved_summary: a polished, ATS-friendly professional summary.
- skills_descriptions: improved, specific descriptions of the candidate's real skills.
- improved_experience: 2-5 polished resume bullet points based only on actual
  projects/experience supplied. If none are supplied, return an empty array.
- change_highlights: 3-5 clear explanations of what was improved and why.
- improvement_suggestions: practical missing details the candidate could add.
Do not invent metrics, employers, achievements, dates, certifications or skills.
Do not write a cover letter; leave that field empty. The before and improved
versions must be meaningfully distinct in clarity, structure and professional wording.
"""
    }
    return FEW_SHOT_EXAMPLE + "\n" + common + "\nTask:\n" + instructions[action]

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "model": MODEL_NAME})

@app.route("/api/generate", methods=["POST"])
def generate():
    data = request.get_json(silent=True) or {}
    action = data.get("action", "")
    if action not in {"resume", "cover-letter", "improve"}:
        return jsonify({"error": "Please choose a valid generation option."}), 400

    required_fields = ["full_name", "education", "skills"]
    missing = [field for field in required_fields if not str(data.get(field, "")).strip()]
    if missing:
        return jsonify({"error": "Please complete your name, education and skills."}), 400

    try:
        client = get_client()
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=build_prompt(data, action),
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=OUTPUT_SCHEMA,
                temperature=0.45,
                max_output_tokens=2200
            )
        )
        result = json.loads(response.text)
        return jsonify({"success": True, "result": result})
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 503
    except json.JSONDecodeError:
        return jsonify({"error": "The AI returned an unreadable response. Please try again."}), 502
    except Exception as exc:
        app.logger.exception("AI generation failed")
        message = str(exc)
        if "API_KEY_INVALID" in message or "invalid api key" in message.lower():
            message = "Your Gemini API key appears to be invalid. Check the key in your .env file."
        elif "quota" in message.lower() or "resource_exhausted" in message.lower():
            message = "The Gemini API quota may have been reached. Check your Google AI Studio usage and try later."
        else:
            message = "AI generation failed. Check your internet connection, API key and model setting, then try again."
        return jsonify({"error": message}), 502

@app.errorhandler(413)
def too_large(_error):
    return jsonify({"error": "Your request is too large. Please shorten the job description or experience text."}), 413

if __name__ == "__main__":
    app.run(debug=True)

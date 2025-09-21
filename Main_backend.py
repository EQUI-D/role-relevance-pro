from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from werkzeug.utils import secure_filename
from groq import Groq
from dotenv import load_dotenv
import re
import fitz
import docx2txt
from datetime import datetime
from difflib import SequenceMatcher
import math

# Load environment variables
load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

# Initialize Flask app
app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize Groq client
client = Groq(api_key=groq_api_key)

# Text extraction functions
def parse_doc(path):
    if path.endswith(".pdf"):
        text = ""
        with fitz.open(path) as doc:
            for page in doc:
                text += page.get_text("text")
        return text
    elif path.endswith(".docx"):
        text = docx2txt.process(path)
        return text
    else:
        raise ValueError("Unsupported file type")

def read_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()
        return text
    except FileNotFoundError:
        print(f"The file at {file_path} was not found.")
        return ""
    except IOError as e:
        print(f"An error occurred: {e}")
        return ""

# JD parsing functions
def extract_jd_info(jd_text):
    prompt_txt = read_file('prompt.txt')
    
    if not prompt_txt:
        prompt_txt = """You are an expert HR analyst and recruitment specialist.  
        For each job position, extract the following structured information in JSON format:
        1. role: string — primary job title  
        2. overview: string — summary of role/responsibilities  
        3. eligibility_criteria: object containing degrees, streams, backlogs_allowed, gaps_allowed
        4. experience_years: object with min and max years
        5. must_have_skills: object with technical, domain, and soft skills
        6. nice_to_have_skills: array of strings
        7. keywords: object with primary and secondary keywords
        8. location: string
        9. employment_type: string
        Return the output strictly as a JSON array, with one object per job position."""

    prompt = f"{prompt_txt}\n\"\"\"{jd_text}\"\"\""

    try:
        completion = client.chat.completions.create(
            model="gemma2-9b-it",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_completion_tokens=1024,
            top_p=1,
            stream=False
        )

        response_text = completion.choices[0].message.content
        
        try:
            jd_data = json.loads(response_text)
            if not isinstance(jd_data, list):
                jd_data = [jd_data]
        except:
            jd_data = []
            
        return jd_data
    except Exception as e:
        print(f"Error extracting JD info: {e}")
        return []

# Resume parsing functions
def split_resume(text):
    sections = {
        "about": "",
        "education": [],
        "experience_years": 0,
        "skills": [],
        "projects": [],
        "certifications": []
    }

    if not text or not text.strip():
        return sections

    text = re.sub(r'\r\n', '\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    text_lower = text.lower()
    lines = text.split('\n')

    patterns = {
        "education": r'^\s*(education|academics?|academic\s+background|qualifications?|educational?\s+background)\s*:?\s*$',
        "work_experience": r'^\s*(experience|employment\s+history|work\s+history|professional\s+experience|career\s+history|work\s+experience|job\s+experience|internships?)\s*:?\s*$',
        "skills": r'^\s*(skills?|technical\s+skills?|core\s+competencies|competencies|technical\s+competencies|programming\s+skills?|technologies?)\s*:?\s*$',
        "projects": r'^\s*(projects?|academic\s+projects?|personal\s+projects?|key\s+projects?|major\s+projects?|project\s+work)\s*:?\s*$',
        "certifications": r'^\s*(certifications?|certificates?|courses?|training|professional\s+development|licenses?)\s*:?\s*$'
    }

    matches = []
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        if not line_lower:
            continue
            
        for section_key, pattern in patterns.items():
            if re.match(pattern, line_lower):
                matches.append((i, section_key, line.strip()))
                break

    matches.sort(key=lambda x: x[0])

    if matches:
        about_lines = lines[:matches[0][0]]
        sections["about"] = '\n'.join(about_lines).strip()
    else:
        sections["about"] = text.strip()
        return sections

    raw_sections = {}
    for i, (line_idx, section_key, header) in enumerate(matches):
        if i + 1 < len(matches):
            end_line_idx = matches[i + 1][0]
        else:
            end_line_idx = len(lines)
        
        section_lines = lines[line_idx + 1:end_line_idx]
        section_content = '\n'.join(section_lines).strip()
        raw_sections[section_key] = section_content

    if "education" in raw_sections:
        edu_text = raw_sections["education"]
        if edu_text:
            edu_entries = re.split(r'\n\s*\n', edu_text)
            
            for entry in edu_entries:
                if not entry.strip():
                    continue
                    
                entry = entry.strip()
                edu_dict = {
                    "degree": "",
                    "branch": "",
                    "cgpa": None,
                    "end_year": None,
                    "college": ""
                }
                
                degree_pattern = r'(bachelor|master|b\.?\s*tech|m\.?\s*tech|b\.?\s*sc|m\.?\s*sc|b\.?\s*e\.?|m\.?\s*e\.?|b\.?\s*a\.?|m\.?\s*a\.?|phd|doctorate|diploma)[^,\n]*'
                degree_match = re.search(degree_pattern, entry, re.I)
                
                branch_pattern = r'(computer\s+science|information\s+technology|mechanical|electrical|electronics?|civil|production|manufacturing|software|data\s+science|artificial\s+intelligence|machine\s+learning)[^,\n]*'
                branch_match = re.search(branch_pattern, entry, re.I)
                
                cgpa_pattern = r'(?:cgpa|gpa|grade)?\s*:?\s*(\d+(?:\.\d+)?)\s*(?:/\s*(?:10|4))?'
                cgpa_match = re.search(cgpa_pattern, entry, re.I)
                
                year_pattern = r'(?:20\d{2})\s*[-–]\s*(20\d{2})|(?:graduating|graduated)?\s*(?:in\s+)?(20\d{2})'
                year_match = re.search(year_pattern, entry, re.I)
                
                lines_in_entry = [line.strip() for line in entry.split('\n') if line.strip()]
                college_keywords = ['university', 'college', 'institute', 'school', 'academy']
                college = ""
                for line in lines_in_entry:
                    if any(keyword in line.lower() for keyword in college_keywords):
                        college = line
                        break
                if not college and lines_in_entry:
                    college = max(lines_in_entry, key=len)
                
                edu_dict["degree"] = degree_match.group(0).strip() if degree_match else ""
                edu_dict["branch"] = branch_match.group(0).strip() if branch_match else ""
                edu_dict["cgpa"] = float(cgpa_match.group(1)) if cgpa_match else None
                edu_dict["end_year"] = int(year_match.group(1) or year_match.group(2)) if year_match else None
                edu_dict["college"] = college
                
                sections["education"].append(edu_dict)

    if "skills" in raw_sections:
        skills_text = raw_sections["skills"]
        if skills_text:
            skills = re.split(r'[,|\n•\-\*→▪▫◦‣⁃]', skills_text)
            skills = [s.strip() for s in skills if len(s.strip()) > 1 and not s.strip().startswith(':')]
            skills = [s for s in skills if not re.match(r'^\s*(skills?|technical|technologies?)\s*:?\s*$', s, re.I)]
            sections["skills"] = skills

    if "projects" in raw_sections:
        proj_text = raw_sections["projects"]
        if proj_text:
            projects = re.split(r'\n\s*\n|\n\s*[•\-\*→▪▫◦‣⁃]\s*', proj_text)
            projects = [p.strip().lstrip('•-*→▪▫◦‣⁃ ') for p in projects if p.strip()]
            sections["projects"] = projects

    if "certifications" in raw_sections:
        cert_text = raw_sections["certifications"]
        if cert_text:
            certs = re.split(r'\n\s*[•\-\*→▪▫◦‣⁃]\s*|\n(?=\w)', cert_text)
            certs = [c.strip().lstrip('•-*→▪▫◦‣⁃ ') for c in certs if c.strip()]
            sections["certifications"] = certs

    if "work_experience" in raw_sections:
        exp_text = raw_sections["work_experience"]
        year_ranges = re.findall(r'(20\d{2})\s*[-–]\s*(20\d{2}|present|current)', exp_text, re.I)
        total_months = 0
        current_year = datetime.now().year
        
        for start_year, end_year in year_ranges:
            start = int(start_year)
            if end_year.lower() in ['present', 'current']:
                end = current_year
            else:
                end = int(end_year)
            total_months += (end - start) * 12
        
        sections["experience_years"] = total_months / 12

    return sections

# Scoring functions
def normalize_text(text):
    if not text:
        return ""
    text = re.sub(r'[^\w\s+#.-]', ' ', str(text).lower())
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def fuzzy_match_score(term, text, threshold=0.6):
    term_normalized = normalize_text(term)
    text_normalized = normalize_text(text)
    
    if term_normalized in text_normalized:
        return 1.0
    
    words_in_term = term_normalized.split()
    best_score = 0.0
    
    if len(words_in_term) > 1:
        word_matches = sum(1 for word in words_in_term if word in text_normalized)
        if word_matches == len(words_in_term):
            return 0.9
        elif word_matches > 0:
            best_score = max(best_score, word_matches / len(words_in_term) * 0.7)
    
    text_words = text_normalized.split()
    for word in text_words:
        similarity = SequenceMatcher(None, term_normalized, word).ratio()
        if similarity >= threshold:
            best_score = max(best_score, similarity)
    
    return best_score

def check_presence_advanced(term, text_blob, context_boost=False):
    term_lower = normalize_text(term)
    text_lower = normalize_text(text_blob)
    
    if term_lower == 'r':
        r_patterns = [r'\br\b(?:\s+(?:programming|language|statistical|data|analysis))?',
                     r'(?:programming|language|statistical)\s+r\b',
                     r'r\s+(?:studio|programming|statistical)']
        return any(re.search(pattern, text_lower) for pattern in r_patterns)
    
    score = fuzzy_match_score(term, text_blob)
    
    if context_boost and score > 0.5:
        tech_contexts = ['programming', 'development', 'software', 'technology', 
                        'framework', 'library', 'tool', 'platform', 'database']
        for context in tech_contexts:
            if context in text_lower:
                score = min(1.0, score + 0.1)
                break
    
    return score

def calculate_skills_score_advanced(resume_text, resume_skills, jd_skills):
    total_score = 0
    detailed_breakdown = {}
    
    combined_text = f"{resume_text} {' '.join(resume_skills)}"
    
    skill_categories = {
        'technical': {'weight': 30, 'skills': jd_skills.get('technical', [])},
        'domain': {'weight': 15, 'skills': jd_skills.get('domain', [])},
        'soft': {'weight': 5, 'skills': jd_skills.get('soft', [])}
    }
    
    for category, info in skill_categories.items():
        if not info['skills']:
            detailed_breakdown[category] = {'score': info['weight'], 'matches': [], 'total_possible': info['weight']}
            total_score += info['weight']
            continue
            
        matches = []
        category_score = 0
        
        for skill in info['skills']:
            match_score = check_presence_advanced(skill, combined_text, context_boost=True)
            if match_score > 0.3:
                matches.append({
                    'skill': skill,
                    'match_score': round(match_score, 2),
                    'points': (match_score / len(info['skills'])) * info['weight']
                })
                category_score += (match_score / len(info['skills'])) * info['weight']
        
        detailed_breakdown[category] = {
            'score': round(category_score, 2),
            'matches': matches,
            'total_possible': info['weight']
        }
        total_score += category_score
    
    return total_score, detailed_breakdown

def calculate_experience_score_advanced(resume_exp, jd_exp):
    min_exp_required = jd_exp.get('min', 0)
    max_exp_preferred = jd_exp.get('preferred', min_exp_required + 3)
    
    if min_exp_required is None or min_exp_required == 0:
        return 25, "No minimum experience required"
    
    if resume_exp >= max_exp_preferred:
        return 25, f"Exceeds preferred experience ({resume_exp} >= {max_exp_preferred})"
    elif resume_exp >= min_exp_required:
        excess_ratio = (resume_exp - min_exp_required) / (max_exp_preferred - min_exp_required)
        score = 20 + (5 * excess_ratio)
        return round(score, 2), f"Meets minimum requirement ({resume_exp} >= {min_exp_required})"
    elif resume_exp >= min_exp_required * 0.7:
        ratio = resume_exp / min_exp_required
        score = 15 * ratio
        return round(score, 2), f"Close to minimum requirement ({resume_exp}/{min_exp_required})"
    else:
        return 0, f"Below minimum requirement ({resume_exp} < {min_exp_required})"

def calculate_education_score_advanced(resume_edu, jd_edu):
    if not resume_edu:
        return 0, "No education information provided"
    
    required_degrees = jd_edu.get('degrees', {}).get('required', [])
    preferred_degrees = jd_edu.get('degrees', {}).get('preferred', [])
    required_fields = jd_edu.get('fields', [])
    
    if not required_degrees and not required_fields:
        return 15, "No specific education requirements"
    
    max_score = 0
    best_match_reason = ""
    
    for edu in resume_edu:
        degree_text = normalize_text(edu.get('degree', ''))
        field_text = normalize_text(edu.get('branch', ''))
        
        current_score = 0
        reasons = []
        
        if required_degrees:
            for req_degree in required_degrees:
                if normalize_text(req_degree) in degree_text:
                    current_score += 10
                    reasons.append(f"Required degree match: {req_degree}")
                    break
            else:
                degree_hierarchy = {
                    'phd': 4, 'doctorate': 4, 'doctoral': 4,
                    'master': 3, 'mtech': 3, 'msc': 3, 'me': 3, 'ma': 3,
                    'bachelor': 2, 'btech': 2, 'bsc': 2, 'be': 2, 'ba': 2,
                    'diploma': 1, 'certificate': 1
                }
                
                resume_level = 0
                req_level = 0
                
                for degree, level in degree_hierarchy.items():
                    if degree in degree_text:
                        resume_level = max(resume_level, level)
                    for req_degree in required_degrees:
                        if degree in normalize_text(req_degree):
                            req_level = max(req_level, level)
                
                if resume_level >= req_level and req_level > 0:
                    current_score += 7
                    reasons.append("Degree level meets/exceeds requirement")
        
        if preferred_degrees:
            for pref_degree in preferred_degrees:
                if normalize_text(pref_degree) in degree_text:
                    current_score += 3
                    reasons.append(f"Preferred degree match: {pref_degree}")
                    break
        
        if required_fields:
            for req_field in required_fields:
                field_score = fuzzy_match_score(req_field, field_text)
                if field_score > 0.6:
                    field_points = 5 * field_score
                    current_score += field_points
                    reasons.append(f"Field match: {req_field} ({field_score:.2f})")
                    break
        
        if current_score > max_score:
            max_score = current_score
            best_match_reason = "; ".join(reasons) if reasons else "Basic education provided"
    
    return min(15, round(max_score, 2)), best_match_reason

def calculate_keywords_score_advanced(resume_text, jd_keywords):
    if not jd_keywords:
        return 10, {}
    
    detailed_matches = {}
    total_score = 0
    
    keyword_categories = {
        'primary': {'weight': 6, 'keywords': jd_keywords.get('primary', [])},
        'secondary': {'weight': 4, 'keywords': jd_keywords.get('secondary', [])}
    }
    
    for category, info in keyword_categories.items():
        if not info['keywords']:
            detailed_matches[category] = {'score': info['weight'], 'matches': []}
            total_score += info['weight']
            continue
        
        matches = []
        category_score = 0
        
        for keyword in info['keywords']:
            match_score = check_presence_advanced(keyword, resume_text)
            if match_score > 0.3:
                points = (match_score / len(info['keywords'])) * info['weight']
                matches.append({
                    'keyword': keyword,
                    'match_score': round(match_score, 2),
                    'points': round(points, 2)
                })
                category_score += points
        
        detailed_matches[category] = {
            'score': round(category_score, 2),
            'matches': matches
        }
        total_score += category_score
    
    return total_score, detailed_matches

def score_resume(resume_data, jd):
    resume_text = normalize_text(" ".join([
        resume_data.get('about', ''),
        " ".join(resume_data.get('skills', [])),
        " ".join(resume_data.get('projects', []))
    ]))
    
    skills_score, skills_details = calculate_skills_score_advanced(
        resume_text, resume_data.get('skills', []), jd['must_have_skills'])
    
    experience_score, exp_reason = calculate_experience_score_advanced(
        resume_data.get('experience_years', 0), jd.get('experience_years', {}))
    
    education_score, edu_reason = calculate_education_score_advanced(
        resume_data.get('education', []), jd.get('eligibility_criteria', {}))
    
    keywords_score, keywords_details = calculate_keywords_score_advanced(
        resume_text, jd.get('keywords', {}))
    
    total_score = skills_score + experience_score + education_score + keywords_score
    
    result = {
        "role": jd.get('role', 'N/A'),
        "candidate": resume_data.get('about', 'N/A').split('\n')[0].strip() if resume_data.get('about') else 'Unknown',
        "total_score": round(total_score, 2),
        "percentage": round((total_score/100)*100, 1),
        "skills_score": round(skills_score, 2),
        "experience_score": round(experience_score, 2),
        "education_score": round(education_score, 2),
        "keywords_score": round(keywords_score, 2),
        "detailed_analysis": {
            "skills_breakdown": skills_details,
            "experience_reason": exp_reason,
            "education_reason": edu_reason,
            "keywords_breakdown": keywords_details
        }
    }
    
    return result

# Flask routes
@app.route('/')
def home():
    return jsonify({"message": "Resume Relevance Check System API", "status": "active"})

@app.route('/upload/jd', methods=['POST'])
def upload_jd():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and (file.filename.endswith('.pdf') or file.filename.endswith('.docx')):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            jd_text = parse_doc(filepath)
            jd_data = extract_jd_info(jd_text)
            
            return jsonify({
                "message": "JD processed successfully",
                "jd_data": jd_data,
                "filename": filename
            })
        except Exception as e:
            return jsonify({"error": f"Error processing JD: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid file type. Only PDF and DOCX files are allowed."}), 400

@app.route('/upload/resume', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    if file and (file.filename.endswith('.pdf') or file.filename.endswith('.docx')):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            resume_text = parse_doc(filepath)
            resume_data = split_resume(resume_text)
            
            return jsonify({
                "message": "Resume processed successfully",
                "resume_data": resume_data,
                "filename": filename
            })
        except Exception as e:
            return jsonify({"error": f"Error processing resume: {str(e)}"}), 500
    else:
        return jsonify({"error": "Invalid file type. Only PDF and DOCX files are allowed."}), 400

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        
        if not data or 'resume_data' not in data or 'jd_data' not in data:
            return jsonify({"error": "Resume data and JD data are required"}), 400
        
        resume_data = data['resume_data']
        jd_data = data['jd_data']
        
        if not isinstance(jd_data, list):
            jd_data = [jd_data]
        
        results = []
        for jd in jd_data:
            result = score_resume(resume_data, jd)
            results.append(result)
        
        return jsonify({
            "message": "Analysis completed successfully",
            "results": results
        })
    except Exception as e:
        return jsonify({"error": f"Error during analysis: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "Resume Relevance Check System"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000, debug=True)
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from streamlit_google_auth import Authenticate
from streamlit_tags import st_tags
from validator_collection import checkers

import boto3
import streamlit as st

from datetime import datetime, date

import copy
import json
import os

from strings import date_to_string, internal_to_external


load_dotenv()


if os.environ.get("ENVIRONMENT"):
    ENVIRONMENT = "local"
    AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
    AWS_SECRET_KEY_ID = os.environ["AWS_SECRET_KEY_ID"]
    REDIRECT_URI = os.environ["REDIRECT_URI"]
    GOOGLE_CLOUD_CREDENTIALS = json.loads(os.environ["GOOGLE_CLOUD_CREDENTIALS"])
    with open("credentials.json", "w+") as f:
        f.write(json.dumps(GOOGLE_CLOUD_CREDENTIALS))
else:
    ENVIRONMENT = "production"

AWS_S3_BUCKET = "user-resume-info-resume-builder-tailor"


class ListInputController:
    def __init__(self, key, data_model):
        self.data_model = data_model
        self.key = key
        if self.key not in st.session_state:
            st.session_state[self.key] = []
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_value, traceback):
        pass
    
    def add_item(self):
        st.session_state[self.key].append(copy.deepcopy(self.data_model))
    
    def delete_item(self, index):
        del st.session_state[self.key][index]
        st.rerun()


def validate_partial_form(partial_form, errors: list, key=None, idx=None, name=None):
    if isinstance(partial_form, dict):
        new_name = name if name is not None else partial_form.get("name")
        for (section, item) in partial_form.items():
            validate_partial_form(item, errors, key=section, idx=idx, name=new_name)
    elif isinstance(partial_form, list):
        for i, item in enumerate(partial_form):
            validate_partial_form(item, errors, idx=i, name=name)
    elif isinstance(partial_form, str):
        external_key = internal_to_external(key)
        if external_key is None:
            return
        errors.append(safe_assert(
            checkers.is_not_empty(partial_form) or external_key.endswith("(Optional)"), 
            (f"{external_key} required." if idx is None or name is None else f"{external_key} required for entry {idx + 1} in {name}.")
        ))


def postprocess_partial_form(partial_form):
    if isinstance(partial_form, dict):
        return {section: postprocess_partial_form(item) for (section, item) in partial_form.items()}
    elif isinstance(partial_form, list):
        return [postprocess_partial_form(item) for item in partial_form]
    elif isinstance(partial_form, date):
        return date_to_string(partial_form)
    return partial_form


def postprocess_partial_intermediate_form(partial_form):
    if isinstance(partial_form, dict):
        return {section: postprocess_partial_intermediate_form(item) for (section, item) in partial_form.items()}
    elif isinstance(partial_form, list):
        return [postprocess_partial_intermediate_form(item) for item in partial_form]
    elif isinstance(partial_form, date):
        return str(partial_form)
    return partial_form


def preprocess_partial_intermediate_form(partial_form):
    if isinstance(partial_form, dict):
        return {section: preprocess_partial_intermediate_form(item) for (section, item) in partial_form.items()}
    elif isinstance(partial_form, list):
        return [preprocess_partial_intermediate_form(item) for item in partial_form]
    elif isinstance(partial_form, str):
        try:
            return datetime.strptime(partial_form, '%Y-%m-%d').date()
        except:
            return partial_form
    return partial_form


def safe_assert(condition, error_message):
    try:
        assert condition
    except AssertionError:
        return error_message


def validate_and_post_process(resume_data: dict):
    errors = []

    errors.append(
        safe_assert(
            (checkers.is_email(resume_data["info"]["email"]) and checkers.is_not_empty(resume_data["info"]["email"])) or
            not checkers.is_not_empty(resume_data["info"]["email"]), "Email is not valid.")
    )
    errors.append(
        safe_assert(
            (checkers.is_url(resume_data["info"]["linkedin"]) and checkers.is_not_empty(resume_data["info"]["linkedin"])) or
            not checkers.is_not_empty(resume_data["info"]["linkedin"]), "LinkedIn link is not valid.")
    )
    errors.append(
        safe_assert(
            (checkers.is_url(resume_data["info"]["profile"], allow_empty=True) and checkers.is_not_empty(resume_data["info"]["profile"]) or
            not checkers.is_not_empty(resume_data["info"]["profile"])), "Profile link is not valid.")
    )
    validate_partial_form(resume_data, errors)

    errors = list(filter(lambda x: x is not None, errors))

    if errors:
        warnings = '\n'.join(list(map(lambda x: "- " + x, errors)))
        st.warning(
            f"Invalid input detected. Errors found:\n {warnings}"
        )
    
    return postprocess_partial_form(resume_data), len(errors) == 0


class AWSClient:
    def __init__(self):
        if ENVIRONMENT == "local":
            self.client = boto3.client(
                's3', 
                aws_access_key_id=AWS_ACCESS_KEY_ID, 
                aws_secret_access_key=AWS_SECRET_KEY_ID
            )
        else:
            self.client = boto3.client('s3')
    
    def get_resume(self, user_id):
        try:
            response = self.client.get_object(
                Bucket=AWS_S3_BUCKET, 
                Key=f"{user_id}_intermediate.json"
            )
            text = preprocess_partial_intermediate_form(json.loads(response["Body"].read().decode()))
            for k, v in text.items():
                st.session_state[k] = v
        except ClientError as e:
            print(e)
    
    def put_intermediate_resume(self, user_id):
        resume_data = copy.deepcopy({
            k: st.session_state[k] for k in 
            list(filter(lambda x: x not in ["authenticator"], st.session_state.keys()))
        })

        self.client.put_object(
            Body=(bytes(json.dumps(postprocess_partial_intermediate_form(resume_data)).encode('UTF-8'))), 
            Bucket=AWS_S3_BUCKET, 
            Key=f"{user_id}_intermediate.json"
        )
    
    def put_final_resume(self, user_id):
        resume_data = {
            "info": copy.deepcopy(st.session_state.user_resume_information),
            "sections": copy.deepcopy(list(st.session_state.get("sections", []).values()))
        }
        for section in resume_data["sections"]:
            section["items"] = copy.deepcopy(st.session_state[section["name"]])
        resume_data, is_valid = validate_and_post_process(resume_data)

        if is_valid:
            self.client.put_object(
                Body=(bytes(json.dumps(resume_data).encode('UTF-8'))), 
                Bucket=AWS_S3_BUCKET, 
                Key=f"{user_id}_final.json"
            )
        else:
            print("not valid")


def main():
    st.title("Let's build a resume.")

    if 'connected' not in st.session_state:
        authenticator = Authenticate(
            secret_credentials_path = 'credentials.json',
            cookie_name='my_cookie_name',
            cookie_key='this_is_secret',
            redirect_uri=REDIRECT_URI,
        )
        st.session_state["authenticator"] = authenticator

    st.session_state["authenticator"].check_authentification()

    if not st.session_state.get('connected', False):
        authorization_url = st.session_state["authenticator"].get_authorization_url()
        st.link_button('Login', authorization_url)
        st.session_state.page = 0
    else:
        st.session_state.page = 1 if not st.session_state.get("page") or st.session_state.page == 0 else st.session_state.page

        if "logged_in" not in st.session_state:
            s3_client = AWSClient()
            s3_client.get_resume(st.session_state.user_info['id'])
        st.session_state.logged_in = True

    if "user_resume_information" not in st.session_state:
        st.session_state.user_resume_information = {
            "firstname": "",
            "lastname": "",
            "phone": "",
            "email": "",
            "linkedin": "",
            "profile": "",
            "domains": [],
            "is_swe": False
        }

    if "sections" not in st.session_state:
        st.session_state.sections = dict()

    if st.session_state.page == 1:
        st.header("Personal Information", divider="grey")

        st.session_state.user_resume_information["firstname"] = st.text_input(
            internal_to_external("firstname"), 
            key="firstname",
            value=st.session_state.user_resume_information["firstname"]
        )
        st.session_state.user_resume_information["lastname"] = st.text_input(
            internal_to_external("lastname"), 
            key="lastname",
            value=st.session_state.user_resume_information["lastname"]
        )
        st.session_state.user_resume_information["phone"] = st.text_input(
            internal_to_external("phone"), 
            key="phone",
            value=st.session_state.user_resume_information["phone"]
        )
        st.session_state.user_resume_information["email"] = st.text_input(
            internal_to_external("email"), 
            key="email",
            value=st.session_state.user_resume_information["email"]
        )
        st.session_state.user_resume_information["linkedin"] = st.text_input(
            internal_to_external("linkedin"), 
            key="linkedin",
            value=st.session_state.user_resume_information["linkedin"]
        )
        st.session_state.user_resume_information["profile"] = st.text_input(
            internal_to_external("profile"), 
            key="profile",
            value=st.session_state.user_resume_information["profile"]
        )
        st.session_state.user_resume_information["domains"] = st_tags(
            label="What areas your areas of focus/interest? Examples include Software Engineering, AI/ML Research, etc.",
            key="domains",
            value=st.session_state.user_resume_information["domains"]
        )

        st.header("Education Information", divider="grey")

        with ListInputController("education", {
            "institution": "",
            "institution_location": "",
            "degree_name": "",
            "start": datetime.now(),
            "end": datetime.now(),
            "relevant_coursework": "",
        }) as education_controller:
            
            if st.button("Add Education"):
                education_controller.add_item()

            for i in range(len(st.session_state.education)):
                with st.expander(f"**Education Item {i + 1}**", expanded=True):
                    st.session_state.education[i]["institution"] = st.text_input(
                        "Institution name", 
                        key=f"institution_{i}", 
                        value=st.session_state.education[i]["institution"]
                    )
                    st.session_state.education[i]["institution_location"] = st.text_input(
                        "Institution location", 
                        key=f"location_{i}",
                        value=st.session_state.education[i]["institution_location"]
                    )
                    st.session_state.education[i]["degree_name"] = st.text_input(
                        "Degree obtained/obtaining", 
                        key=f"obtained_{i}",
                        value=st.session_state.education[i]["degree_name"]
                    )
                    st.session_state.education[i]["start"] = st.date_input(
                        "Start", 
                        format="DD/MM/YYYY", 
                        key=f"start_{i}",
                        value=st.session_state.education[i]["start"]
                    )
                    st.session_state.education[i]["end"] = st.date_input(
                        "End (Actual or Expected)", 
                        format="DD/MM/YYYY", 
                        key=f"end_{i}",
                        value=st.session_state.education[i]["end"]
                    )
                    st.session_state.education[i]["relevant_coursework"] = st.text_input(
                        "Relevant coursework", 
                        key=f"coursework_{i}",
                        value=st.session_state.education[i]["relevant_coursework"]
                    )
                    st.session_state.education[i]["completed"] = st.session_state.education[i]["end"] <= datetime.now().date()

                    if st.button("Delete", key=f"education_delete_{i}"):
                        education_controller.delete_item(i)

             
        st.header("Additional Information")

        is_swe = st.checkbox(
            "I am applying for software engineering (or adjacent) roles", 
            key="is_swe", 
            value=st.session_state.user_resume_information["is_swe"]
        )

        st.session_state.user_resume_information.update({
            "education": st.session_state.education,
            "core_skill_label": "Languages" if is_swe else "Skills",
            "extra_skill_label": "Technologies" if is_swe else None,
            "domain_label": "Domains" if is_swe else "Areas of Focus",
            "is_swe": is_swe
        })

        st.divider()
        col1, col2 = st.columns([1, 9])

        with col1:
            if st.button("Save", use_container_width=True):
                s3_client = AWSClient()
                s3_client.put_intermediate_resume(st.session_state.user_info['id'])

        with col2:
            if st.button("Save & Continue", type="primary"):
                st.session_state.user_resume_information.update({
                    "education": st.session_state.education,
                    "core_skill_label": "Languages" if is_swe else "Skills",
                    "extra_skill_label": "Technologies" if is_swe else None,
                    "domain_label": "Domains" if is_swe else "Areas of Focus",
                    "is_swe": is_swe
                })
                st.session_state.page = 2
                st.rerun()

    elif st.session_state.page == 2:
        core_skills_label = st.session_state.user_resume_information["core_skill_label"]
        extra_skills_label = st.session_state.user_resume_information["extra_skill_label"]

        section_titles = {"Experience": "experience", "Extracurriculars": "extracurriculars", "Projects": "projects"}
        
        st.header("Add Sections")
        st.text(f"These are the parts of your resume where you add the details of all the past work. Please add as much information as possible.")
        section_type = st.selectbox("Select Section Type", list(section_titles.keys()))

        if "sections" not in st.session_state:
            st.session_state.sections = dict()
        
        if st.button("Add Section"):
            st.session_state.sections[section_titles[section_type]] = {
                "name": section_titles[section_type], 
                "items": [],
                "include": False
            }
        
        for name, section in st.session_state.sections.items():
            st.subheader(f"{section['name'].capitalize()}", divider="grey")
            
            st.session_state.sections[name]["include"] = st.checkbox(
                "Include all entries in this section on my resume", 
                key=f"include_{name}",
                value=st.session_state.sections[name]["include"]
            )
            with ListInputController(name, {
                "organization": "",
                "location": "",
                "position": "",
                "start": datetime.now(),
                "end": datetime.now(),
                "core_skills": [],
                "extra_skills": [],
                "description": [],
                "still_working": False
            }) as section_controller:
                
                if st.button(f"Add {name.capitalize()} Item"):
                    section_controller.add_item()
                
                for i in range(len(st.session_state[name])):
                    with st.expander(f"**{name.capitalize()} Item {i + 1}**", expanded=True):
                        st.session_state[name][i]["organization"] = st.text_input(
                            internal_to_external("organization"), 
                            key=f"org_{name}_{i}",
                            value=st.session_state[name][i]["organization"]
                        )
                        st.session_state[name][i]["location"] = st.text_input(
                            internal_to_external("location"), 
                            key=f"loc_{name}_{i}",
                            value=st.session_state[name][i]["location"]
                        )
                        st.session_state[name][i]["position"] = st.text_input(
                            internal_to_external("position"), 
                            key=f"pos_{name}_{i}",
                            value=st.session_state[name][i]["position"]
                        )
                        st.session_state[name][i]["start"] = st.date_input(
                            internal_to_external("start"), 
                            key=f"start_{name}_{i}",
                            value=st.session_state[name][i]["start"]
                        )
                        st.session_state[name][i]["end"] = st.date_input(
                            internal_to_external("end"), 
                            key=f"end_{name}_{i}",
                            value=st.session_state[name][i]["end"],
                            disabled=st.checkbox(
                                "I am currently working here", 
                                key=f"working_{name}_{i}",
                                value=st.session_state[name][i]["still_working"]
                            )
                        )
                        st.session_state[name][i]["core_skills"] = st_tags(
                            label=internal_to_external("core_skills", fmt=core_skills_label), 
                            key=f"core_{name}_{i}",
                            value=st.session_state[name][i]["core_skills"]
                        )

                        if extra_skills_label is not None:
                            st.session_state[name][i]["extra_skills"] = st_tags(
                                label=internal_to_external("extra_skills", fmt=extra_skills_label), 
                                key=f"extra_{name}_{i}",
                                value=st.session_state[name][i]["extra_skills"]
                            )

                        st.text(f"{name.capitalize()} Item {i + 1} Description")

                        with ListInputController(f"{name}_{i}_description", {
                            "summary": "",
                            "required_skills": [],
                            "group": 0
                        }) as description_controller:
                            st.session_state[f"{name}_{i}_description"] = st.session_state[name][i]["description"]
                            if st.button(f"Add Point for {name.capitalize()} {i}"):
                                description_controller.add_item()

                            for j in range(len(st.session_state[f"{name}_{i}_description"])):
                                col1, col2 = st.columns([0.9, 0.1], vertical_alignment="bottom")
                                with col1:
                                    st.session_state[f"{name}_{i}_description"][j]["summary"] = st.text_input(
                                        f"Point {j + 1}", 
                                        key=f"sum_{name}_{i}_{j}",
                                        value=st.session_state[f"{name}_{i}_description"][j]["summary"]
                                    )
                                with col2:
                                    if st.button("", icon=":material/delete:", key=f"{name}_{i}_{j}_description_delete"):
                                        description_controller.delete_item(j)
                        
                        st.session_state[name][i]["description"] = copy.deepcopy(st.session_state[f"{name}_{i}_description"])
                        del st.session_state[f"{name}_{i}_description"]

                        st.divider()
                        if st.button("Delete", key=f"{name}_{i}_delete"):
                            section_controller.delete_item(i)
                            
        st.divider()
        col1, col2, col3 = st.columns([1, 1, 8])

        with col1:
            if st.button("Back", use_container_width=True):
                st.session_state.page = 1
                st.rerun()
        
        with col2:
            if st.button("Save", use_container_width=True):
                s3_client = AWSClient()
                s3_client.put_intermediate_resume(st.session_state.user_info['id'])
        
        with col3:
            if st.button("Submit 🚀", type="primary"):
                s3_client = AWSClient()
                s3_client.put_final_resume(st.session_state.user_info['id'])


if __name__ == "__main__":
    main()

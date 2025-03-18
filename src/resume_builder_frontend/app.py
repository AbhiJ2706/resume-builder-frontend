import streamlit as st


def main():
    st.title("One resume, infinite possibilities.")
    st.subheader("Automatically optimize your resume for any job posting in 3 simple steps:")
    st.markdown(
        """
        1. Enter your resume details
        2. Download the [chrome extension]()
        3. Before you apply for a job, highlight the job posting and run the extension to receive your optimized resume!
        """
    )
    st.subheader("Ready to let your skills shine? Tailor is launching on **March 30th**.")
    
    st.link_button('Join waitlist 🚀', "https://docs.google.com/forms/d/e/1FAIpQLSdw9mSs15qH-si03siMRefj-LrRXg5pQIN5WEm2ZEqDMLxVJw/viewform?usp=dialog", type="primary")
    with st.expander(f"Learn more", expanded=False):
        st.markdown(
            """
            **What is Tailor?**

            Do you spend hours customizing your resume for every job you apply to, only to be automatically rejected?

            Tailor maximizes the relevance of your resume against any job posting you apply to.
            
            When you apply for a job posting, Tailor reads the description. 
            
            It selects the most relevant information and keywords from your experience, and generates a parser-friendly copy of your resume specifically for the position.

            No more formatting errors, typos, or headaches. Tailor helps you look your best for every company!

            **How does it work?**

            Tailor uses a Large Language Model (LLM) to determine your relevant experience with respect to the job posting. It then creates a formatted resume for you based on our library of proven templates.

            **Where does my data go?**

            Your resume data does not leave our servers. All processing, including the LLM-based processing, is performed directly on our servers.

            **Contact Information**

            You can contact us via [email](mailto:tailor.resume.builder@gmail.com)
            """
        )


if __name__ == "__main__":
    main()

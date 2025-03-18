# Use a lightweight AWS Lambda Python base image
FROM python:3.10

# Set working directory
WORKDIR /app

# Copy the application files
COPY . /app

RUN pip install --no-cache-dir hatch

# Install dependencies
RUN hatch dep show requirements > requirements.txt && pip install --no-cache-dir -r requirements.txt

# Expose the default Streamlit port
EXPOSE 8501

# Set the Streamlit entrypoint
CMD ["streamlit", "run", "src/resume_builder_frontend/app.py", "--server.port=8501", "--server.address=0.0.0.0"]

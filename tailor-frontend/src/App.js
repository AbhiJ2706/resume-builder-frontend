import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Button, 
  TextField, 
  Box, 
  Divider, 
  Grid, 
  Paper, 
  FormControlLabel, 
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MuiColorInput } from 'mui-color-input';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import jsonData from './1_intermediate.json';

const theme = createTheme({
    typography: {
      fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',      
      ].join(','),
    },
});

const saveJSONToFile = (data, filename = '1_intermediate.json') => {
    // Convert JSON object to a string with nice formatting
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create a Blob containing the JSON data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to document, click it, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release the URL object
    URL.revokeObjectURL(url);
};

// Mock data persistence
const loadFromLocalStorage = () => {
  try {
    const savedData = localStorage.getItem('tailorResumeData');
    return savedData ? JSON.parse(savedData) : null;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return null;
  }
};

const saveToLocalStorage = (data) => {
  try {
    console.log(JSON.stringify(data));
    saveJSONToFile(data);
    localStorage.setItem('tailorResumeData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

const TagInput = ({ value, onChange, label }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleDelete = (tagToDelete) => {
    onChange(value.filter(tag => tag !== tagToDelete));
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" gutterBottom>{label}</Typography>
      <TextField
        fullWidth
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type and press Enter to add"
        size="small"
        margin="normal"
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {value.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            onDelete={() => handleDelete(tag)}
            size="small"
          />
        ))}
      </Box>
    </Box>
  );
};

const LandingPage = ({ onNavigate }) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>One resume, infinite possibilities.</Typography>
      <Typography variant="h5" gutterBottom>
        Automatically optimize your resume for any job posting in 3 simple steps:
      </Typography>
      <List>
        <ListItem>
          <ListItemText primary="1. Enter your resume details" />
        </ListItem>
        <ListItem>
          <ListItemText primary="2. Download the chrome extension" />
        </ListItem>
        <ListItem>
          <ListItemText primary="3. Before you apply for a job, highlight the job posting and use the extension to receive your optimized resume" />
        </ListItem>
      </List>
      <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>Ready to let your skills shine?</Typography>
      <Button 
        variant="contained" 
        color="primary" 
        size="large" 
        onClick={() => onNavigate(1)}
        sx={{ mt: 2 }}
      >
        Login 🚀
      </Button>

      <Accordion sx={{ mt: 4 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Learn more</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="h6" gutterBottom>What is Tailor?</Typography>
          <Typography paragraph>
            Do you spend hours customizing your resume for every job you apply to, only to be automatically rejected?
          </Typography>
          <Typography paragraph>
            Tailor is a tool which helps you maximize the relevance of your resume with respect to any job posting you apply to.
          </Typography>
          <Typography paragraph>
            When you apply for a job posting, Tailor reads the description.
          </Typography>
          <Typography paragraph>
            It selects the most relevant information from your experience, and generates a parser-friendly copy of your resume specifically for that position.
          </Typography>
          <Typography paragraph>
            No more formatting errors, typos, or headaches. Tailor helps you look your best for every company!
          </Typography>

          <Typography variant="h6" gutterBottom>How does it work?</Typography>
          <Typography paragraph>
            Tailor uses a Large Language Model (LLM) to extract the relevant information from your resume. It then creates a formatted resume based on our library of premade templates.
          </Typography>

          <Typography variant="h6" gutterBottom>Where does my data go?</Typography>
          <Typography paragraph>
            Your resume data does not leave our servers. All processing, including the LLM-based processing, is performed directly on our servers.
          </Typography>

          <Typography variant="h6" gutterBottom>Contact Information</Typography>
          <Typography paragraph>
            You can contact us via <a href="mailto:resume-builder-tailor@gmail.com">email</a>
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Container>
  );
};

const PersonalInformationPage = ({ resumeData, setResumeData, onNavigate, onSave }) => {
  const handleSave = (navigateNext = false) => {
    onSave(resumeData);
    if (navigateNext) {
      onNavigate(2);
    }
  };

  const handleInputChange = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      user_resume_information: {
        ...prev.user_resume_information,
        [field]: value
      }
    }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Let's build a resume.</Typography>
      
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Personal Information
        <Divider sx={{ mt: 1 }} />
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            value={resumeData.user_resume_information.firstname}
            onChange={(e) => handleInputChange('firstname', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Last Name"
            value={resumeData.user_resume_information.lastname}
            onChange={(e) => handleInputChange('lastname', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone"
            value={resumeData.user_resume_information.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            value={resumeData.user_resume_information.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="LinkedIn"
            value={resumeData.user_resume_information.linkedin}
            onChange={(e) => handleInputChange('linkedin', e.target.value)}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Profile Website"
            value={resumeData.user_resume_information.profile}
            onChange={(e) => handleInputChange('profile', e.target.value)}
            margin="normal"
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <TagInput
          label="What areas are your areas of focus/interest? Examples include Software Engineering, AI/ML Research, etc."
          value={resumeData.user_resume_information.domains}
          onChange={(newDomains) => handleInputChange('domains', newDomains)}
        />
      </Box>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Education Information
        <Divider sx={{ mt: 1 }} />
      </Typography>

      <Button 
        variant="outlined" 
        startIcon={<AddIcon />}
        onClick={() => {
          const newEducation = [...resumeData.education, {
            institution: "",
            institution_location: "",
            degree_name: "",
            start: new Date(),
            end: new Date(),
            relevant_coursework: "",
            completed: false
          }];
          setResumeData({...resumeData, education: newEducation});
        }}
        sx={{ mb: 2 }}
      >
        Add Education
      </Button>

      {resumeData.education.map((edu, index) => (
        <Accordion key={index} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              Education Item {index + 1}
              {edu.institution && ` - ${edu.institution}`}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Institution name"
                  value={edu.institution}
                  onChange={(e) => {
                    const newEducation = [...resumeData.education];
                    newEducation[index].institution = e.target.value;
                    setResumeData({...resumeData, education: newEducation});
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Institution location"
                  value={edu.institution_location}
                  onChange={(e) => {
                    const newEducation = [...resumeData.education];
                    newEducation[index].institution_location = e.target.value;
                    setResumeData({...resumeData, education: newEducation});
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Degree obtained/obtaining"
                  value={edu.degree_name}
                  onChange={(e) => {
                    const newEducation = [...resumeData.education];
                    newEducation[index].degree_name = e.target.value;
                    setResumeData({...resumeData, education: newEducation});
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={new Date(edu.start)}
                    onChange={(newDate) => {
                      const newEducation = [...resumeData.education];
                      newEducation[index].start = newDate;
                      setResumeData({...resumeData, education: newEducation});
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date (Actual or Expected)"
                    value={new Date(edu.end)}
                    onChange={(newDate) => {
                      const newEducation = [...resumeData.education];
                      newEducation[index].end = newDate;
                      setResumeData({...resumeData, education: newEducation});
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Relevant coursework"
                  value={edu.relevant_coursework}
                  onChange={(e) => {
                    const newEducation = [...resumeData.education];
                    newEducation[index].relevant_coursework = e.target.value;
                    setResumeData({...resumeData, education: newEducation});
                  }}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => {
                    const newEducation = resumeData.education.filter((_, i) => i !== index);
                    setResumeData({...resumeData, education: newEducation});
                  }}
                >
                  Delete
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Additional Information
        <Divider sx={{ mt: 1 }} />
      </Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={resumeData.user_resume_information.is_swe}
            onChange={(e) => handleInputChange('is_swe', e.target.checked)}
          />
        }
        label="I am applying for software engineering (or adjacent) roles"
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" gutterBottom>Choose an accent color for your resume</Typography>
        <MuiColorInput
          value={resumeData.user_resume_information.color || "#007BA7"}
          onChange={(newColor) => handleInputChange('color', newColor)}
        />
      </Box>

      <Typography variant="body2" sx={{ mt: 2 }}>
        Choose a default template for your resume. This will be used in application portals where we don't have an optimized template.
      </Typography>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={() => handleSave(false)}>
          Save
        </Button>
        <Button variant="contained" onClick={() => handleSave(true)}>
          Save & Continue
        </Button>
      </Box>
    </Container>
  );
};

const ExperienceSection = ({ resumeData, setResumeData, onNavigate, onSave }) => {
  const handleSave = (navigateNext = false) => {
    onSave(resumeData);
    if (navigateNext) {
      onNavigate(3);
    }
  };

  const handleAddSection = (sectionType) => {
    const sectionMap = {
      "Experience": "experience",
      "Extracurriculars": "extracurriculars", 
      "Projects": "projects", 
      "Research": "research"
    };
    
    const key = sectionMap[sectionType];
    
    if (!resumeData.sections[key]) {
      setResumeData({
        ...resumeData,
        sections: {
          ...resumeData.sections,
          [key]: {
            name: key,
            items: [],
            include: false
          }
        }
      });

      // Initialize the section array if it doesn't exist
      if (!resumeData[key]) {
        setResumeData(prev => ({
          ...prev,
          [key]: []
        }));
      }
    }
  };

  const handleAddItem = (sectionName) => {
    const newItem = {
      organization: "",
      location: "",
      position: "",
      start: new Date(),
      end: new Date(),
      core_skills: [],
      extra_skills: [],
      description: [],
      still_working: false,
      link: ""
    };

    setResumeData(prev => ({
      ...prev,
      [sectionName]: [...(prev[sectionName] || []), newItem]
    }));
  };

  const handleDeleteItem = (sectionName, itemIndex) => {
    setResumeData(prev => ({
      ...prev,
      [sectionName]: prev[sectionName].filter((_, i) => i !== itemIndex)
    }));
  };

  const handleAddDescriptionPoint = (sectionName, itemIndex) => {
    const newPoint = {
      summary: "",
      required_skills: [],
      group: 0
    };

    setResumeData(prev => {
      const newItems = [...prev[sectionName]];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        description: [...newItems[itemIndex].description, newPoint]
      };
      return {
        ...prev,
        [sectionName]: newItems
      };
    });
  };

  const handleDeleteDescriptionPoint = (sectionName, itemIndex, pointIndex) => {
    setResumeData(prev => {
      const newItems = [...prev[sectionName]];
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        description: newItems[itemIndex].description.filter((_, i) => i !== pointIndex)
      };
      return {
        ...prev,
        [sectionName]: newItems
      };
    });
  };

  // Available section types
  const sectionTypes = ["Experience", "Extracurriculars", "Projects", "Research"];
  const [selectedSectionType, setSelectedSectionType] = useState(sectionTypes[0]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Let's build a resume.</Typography>
      
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Add Sections
      </Typography>
      <Typography variant="body1" paragraph>
        These are the parts of your resume where you add the details of all the past work. 
        <strong> Please add as much information as possible.</strong> The more information you can provide about your past experience, 
        the better we can specialize your resume for different roles and descriptions.
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          select
          label="Select Section Type"
          value={selectedSectionType}
          onChange={(e) => setSelectedSectionType(e.target.value)}
          SelectProps={{
            native: true,
          }}
          sx={{ minWidth: 200 }}
        >
          {sectionTypes.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </TextField>
        <Button 
          variant="outlined" 
          onClick={() => handleAddSection(selectedSectionType)}
        >
          Add Section
        </Button>
      </Box>

      {Object.entries(resumeData.sections).map(([key, section]) => (
        <Box key={key} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mt: 3, mb: 1, textTransform: 'capitalize' }}>
            {section.name}
            <Divider sx={{ mt: 1 }} />
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={section.include}
                onChange={(e) => {
                  setResumeData(prev => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      [key]: {
                        ...prev.sections[key],
                        include: e.target.checked
                      }
                    }
                  }));
                }}
              />
            }
            label="Include all entries in this section on my resume"
          />

          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => handleAddItem(key)}
            sx={{ my: 2 }}
          >
            Add {section.name.charAt(0).toUpperCase() + section.name.slice(1)} Item
          </Button>

          {resumeData[key]?.map((item, itemIndex) => (
            <Accordion key={itemIndex} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  {item.organization ? item.organization : `${section.name.charAt(0).toUpperCase() + section.name.slice(1)} Item ${itemIndex + 1}`}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Organization"
                      value={item.organization}
                      onChange={(e) => {
                        const newItems = [...resumeData[key]];
                        newItems[itemIndex].organization = e.target.value;
                        setResumeData({...resumeData, [key]: newItems});
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={item.location}
                      onChange={(e) => {
                        const newItems = [...resumeData[key]];
                        newItems[itemIndex].location = e.target.value;
                        setResumeData({...resumeData, [key]: newItems});
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Position"
                      value={item.position}
                      onChange={(e) => {
                        const newItems = [...resumeData[key]];
                        newItems[itemIndex].position = e.target.value;
                        setResumeData({...resumeData, [key]: newItems});
                      }}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={new Date(item.start)}
                        onChange={(newDate) => {
                          const newItems = [...resumeData[key]];
                          newItems[itemIndex].start = newDate;
                          setResumeData({...resumeData, [key]: newItems});
                        }}
                        renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={item.still_working}
                          onChange={(e) => {
                            const newItems = [...resumeData[key]];
                            newItems[itemIndex].still_working = e.target.checked;
                            setResumeData({...resumeData, [key]: newItems});
                          }}
                        />
                      }
                      label="I am currently working here"
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={new Date(item.end)}
                        onChange={(newDate) => {
                          const newItems = [...resumeData[key]];
                          newItems[itemIndex].end = newDate;
                          setResumeData({...resumeData, [key]: newItems});
                        }}
                        disabled={item.still_working}
                        renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <TagInput
                      label={`${resumeData.user_resume_information.core_skill_label || 'Skills'}`}
                      value={item.core_skills}
                      onChange={(newSkills) => {
                        const newItems = [...resumeData[key]];
                        newItems[itemIndex].core_skills = newSkills;
                        setResumeData({...resumeData, [key]: newItems});
                      }}
                    />
                  </Grid>
                  
                  {resumeData.user_resume_information.extra_skill_label && (
                    <Grid item xs={12}>
                      <TagInput
                        label={resumeData.user_resume_information.extra_skill_label}
                        value={item.extra_skills}
                        onChange={(newSkills) => {
                          const newItems = [...resumeData[key]];
                          newItems[itemIndex].extra_skills = newSkills;
                          setResumeData({...resumeData, [key]: newItems});
                        }}
                      />
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Link"
                      value={item.link}
                      onChange={(e) => {
                        const newItems = [...resumeData[key]];
                        newItems[itemIndex].link = e.target.value;
                        setResumeData({...resumeData, [key]: newItems});
                      }}
                      margin="normal"
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom>
                      {section.name.charAt(0).toUpperCase() + section.name.slice(1)} Item {itemIndex + 1} Description
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => handleAddDescriptionPoint(key, itemIndex)}
                      sx={{ mb: 2 }}
                    >
                      Add Point
                    </Button>
                    
                    {item.description.map((point, pointIndex) => (
                      <Box key={pointIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          fullWidth
                          label={`Point ${pointIndex + 1}`}
                          value={point.summary}
                          onChange={(e) => {
                            const newItems = [...resumeData[key]];
                            newItems[itemIndex].description[pointIndex].summary = e.target.value;
                            setResumeData({...resumeData, [key]: newItems});
                          }}
                          margin="normal"
                        />
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteDescriptionPoint(key, itemIndex, pointIndex)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Grid>
                  
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Divider />
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeleteItem(key, itemIndex)}
                      sx={{ mt: 2 }}
                    >
                      Delete
                    </Button>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      ))}

      <Divider sx={{ my: 4 }} />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="outlined" onClick={() => onNavigate(1)}>
          Back
        </Button>
        <Button variant="outlined" onClick={() => handleSave(false)}>
          Save
        </Button>
        <Button variant="contained" onClick={() => handleSave(true)}>
          Save & Submit 🚀
        </Button>
      </Box>
    </Container>
  );
};

const SuccessPage = ({ onNavigate }) => {
  return (
    <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>What's next?</Typography>
      
      <List>
        <ListItem>
          <ListItemText primary="1. Download the chrome extension" />
        </ListItem>
        <ListItem>
          <ListItemText primary="2. Before you apply for a job, highlight the job posting and use the extension to receive your optimized resume!" />
        </ListItem>
        <ListItem>
          <ListItemText primary="3. If you need to update your information, come back here! Or else, happy applying!" />
        </ListItem>
      </List>
      
      <Button variant="outlined" onClick={() => onNavigate(2)} sx={{ mt: 4 }}>
        Back
      </Button>
    </Container>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [resumeData, setResumeData] = useState({
    user_resume_information: {
      firstname: "",
      lastname: "",
      phone: "",
      email: "",
      linkedin: "",
      profile: "",
      domains: [],
      is_swe: false,
      color: "#007BA7",
      default_template: "",
      core_skill_label: "Skills",
      extra_skill_label: ""
    },
    education: [],
    sections: {},
    experience: [],
    extracurriculars: [],
    projects: [],
    research: []
  });

  localStorage.setItem('tailorResumeData', JSON.stringify(jsonData));

  useEffect(() => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setResumeData(savedData);
    }
  }, []);

  const handleSave = (data) => {
    setResumeData(data);
    saveToLocalStorage(data);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 0:
        return <LandingPage onNavigate={setCurrentPage} />;
      case 1:
        return <PersonalInformationPage 
          resumeData={resumeData} 
          setResumeData={setResumeData} 
          onNavigate={setCurrentPage} 
          onSave={handleSave}
        />;
      case 2:
        return <ExperienceSection 
          resumeData={resumeData} 
          setResumeData={setResumeData} 
          onNavigate={setCurrentPage} 
          onSave={handleSave}
        />;
      case 3:
        return <SuccessPage onNavigate={setCurrentPage} />;
      default:
        return <LandingPage onNavigate={setCurrentPage} />;
    }
  };
  
  return (
    <ThemeProvider theme={theme}>
        <Box sx={{
            width: '100%',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f5f5f5'
        }}>
        <Container maxWidth="md" sx={{ flex: 1, py: 4 }}>
            {renderPage()}
        </Container>
        </Box>
    </ThemeProvider>
  );
};

export default App;
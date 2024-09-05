"use client"
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input, Button, Select, SelectItem } from "@nextui-org/react";
import axios from "axios";
import { toast } from 'sonner';
import Link from "next/link";
import { useRouter } from 'next/navigation';

const steps = [
  { 
    title: "Personal Information", 
    fields: [
      { name: "firstName", required: true },
      { name: "middleName", required: false },
      { name: "surName", required: true },
      { name: "mobile", required: true },
      { name: "email", required: true },
      { name: "adharCard", required: true }
    ]
  },
  { 
    title: "Additional Details", 
    fields: [
      { name: "dob", required: true },
      { name: "gender", required: true },
      { name: "weight", required: false },
      { name: "height", required: false },
      { name: "bloodGroup", required: true }
    ]
  },
  { 
    title: "Address", 
    fields: [
      { name: "pincode", required: true },
      { name: "building", required: true },
      { name: "city", required: true },
      { name: "taluka", required: false },
      { name: "district", required: true },
      { name: "state", required: true }
     
    ]
  },
  { 
    title: "Medical Information", 
    fields: [
      { name: "allergies", required: false },
      { name: "medicationName", required: false },
      { name: "medicationFrequency", required: false }
    ]
  },
  { 
    title: "Account Setup", 
    fields: [
      { name: "password", required: true },
      { name: "confirmPassword", required: true }
    ]
  },
];

const initialFormData = {
  fullname: { firstName: "", middleName: "", surName: "" },
  mobile: "",
  email: "",
  adharCard: "",
  dob: "",
  gender: "",
  weight: "",
  height: "",
  bloodGroup: "",
  address: {
    pincode: "",
    building: "",
    city: "",
    taluka: "",
    district: "",
    state: ""
    
  },
  allergies: "",
  medication: {
    name: "",
    frequency: ""
  },
  password: "",
  confirmPassword: ""
};

export default function MultiStepRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const validateField = (field, value, required) => {
    if (!required && !value) return "";

    switch (field) {
      case "firstName":
      case "surName":
      case "building":
      case "city":
      case "district":
      case "state":
        return value.trim() ? "" : `${field} is required`;
      case "mobile":
        return /^\d{10}$/.test(value) ? "" : "Invalid mobile number";
      case "email":
        return /\S+@\S+\.\S+/.test(value) ? "" : "Invalid email address";
      case "adharCard":
        return /^\d{12}$/.test(value) ? "" : "Invalid Aadhaar number";
      case "dob":
        return value ? "" : "Date of Birth is required";
      case "gender":
        return value ? "" : "Gender is required";
      case "bloodGroup":
        return value ? "" : "Blood Group is required";
      case "weight":
      case "height":
        return value === "" || (!isNaN(value) && value > 0) ? "" : `Invalid ${field}`;
      case "pincode":
        return /^\d{6}$/.test(value) ? "" : "Invalid pincode";
      case "password":
        return value.length >= 8 ? "" : "Password must be at least 8 characters";
      case "confirmPassword":
        return value === formData.password ? "" : "Passwords do not match";
      default:
        return "";
    }
  };

  const handleInputChange = (field, value) => {
    let updatedFormData = { ...formData };
    if (field === "firstName" || field === "middleName" || field === "surName") {
      updatedFormData.fullname = { ...updatedFormData.fullname, [field]: value };
    } else if (field === "building" || field === "city" || field === "taluka" || field === "district" || field === "state" || field === "pincode") {
      updatedFormData.address = { ...updatedFormData.address, [field]: value };
    } else if (field === "medicationName") {
      updatedFormData.medication = { ...updatedFormData.medication, name: value };
    } else if (field === "medicationFrequency") {
      updatedFormData.medication = { ...updatedFormData.medication, frequency: value };
    } else {
      updatedFormData[field] = value;
    }
    setFormData(updatedFormData);
    const fieldConfig = steps.flatMap(step => step.fields).find(f => f.name === field);
    setErrors({ ...errors, [field]: validateField(field, value, fieldConfig.required) });
  };

  const handleAddressLookup = async () => {
    if (!formData.address.pincode) {
      toast.error("Please enter a pincode");
      return;
    }
    try {
      const response = await axios.get(`https://api.postalpincode.in/pincode/${formData.address.pincode}`);
      if (response.data[0].Status === "Success") {
        const { District, State } = response.data[0].PostOffice[0];
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            district: District,
            state: State
          }
        }));
        setErrors(prev => ({
          ...prev,
          district: "",
          state: ""
        }));
        toast.success("Address details fetched successfully");
      } else {
        toast.error("Invalid pincode");
      }
    } catch (error) {
      toast.error("Error fetching address details");
    }
  };

  const validateStep = (stepIndex) => {
    const stepFields = steps[stepIndex].fields;
    const stepErrors = {};
    let isValid = true;

    stepFields.forEach(field => {
      let value;
      if (field.name === "firstName" || field.name === "middleName" || field.name === "surName") {
        value = formData.fullname[field.name];
      } else if (field.name === "building" || field.name === "city" || field.name === "taluka" || field.name === "district" || field.name === "state" || field.name === "pincode") {
        value = formData.address[field.name];
      } else if (field.name === "medicationName") {
        value = formData.medication.name;
      } else if (field.name === "medicationFrequency") {
        value = formData.medication.frequency;
      } else {
        value = formData[field.name];
      }
      const error = validateField(field.name, value, field.required);
      if (error) {
        stepErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(prev => ({ ...prev, ...stepErrors }));
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      if (currentStep === steps.length - 1) {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
          const { confirmPassword, ...dataToSubmit } = formData;
          const result = await axios.post("/api/register/user", dataToSubmit);
          toast.success('User Registration Successful');
          console.log(result);
          router.push('/');
        } catch (error) {
          console.error("User Registration failed", error);
          toast.error('User Registration failed');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        nextStep();
      }
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast.error("Please fill in all required fields correctly");
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const renderField = (field) => {
    switch (field.name) {
      case "gender":
        return (
          <Select
            label="Gender"
            placeholder="Select gender"
            value={formData.gender}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            errorMessage={errors.gender}
            isInvalid={!!errors.gender}
          >
            <SelectItem key="male" value="male">Male</SelectItem>
            <SelectItem key="female" value="female">Female</SelectItem>
            <SelectItem key="other" value="other">Other</SelectItem>
          </Select>
        );
      case "dob":
        return (
          <Input
            type="date"
            label="Date of Birth"
            value={formData.dob}
            onChange={(e) => handleInputChange("dob", e.target.value)}
            errorMessage={errors.dob}
            isInvalid={!!errors.dob}
          />
        );
      case "password":
      case "confirmPassword":
        return (
          <Input
            type="password"
            label={field.name === "password" ? "Password" : "Confirm Password"}
            value={formData[field.name]}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            errorMessage={errors[field.name]}
            isInvalid={!!errors[field.name]}
          />
        );
      case "pincode":
        return (
          <div className="flex gap-2">
            <Input
              type="text"
              label="Pincode"
              value={formData.address.pincode}
              onChange={(e) => handleInputChange("pincode", e.target.value)}
              errorMessage={errors.pincode}
              isInvalid={!!errors.pincode}
            />
            <Button onClick={handleAddressLookup}>Lookup</Button>
          </div>
        );
      default:
        let value;
        if (field.name === "firstName" || field.name === "middleName" || field.name === "surName") {
          value = formData.fullname[field.name];
        } else if (field.name === "building" || field.name === "city" || field.name === "taluka" || field.name === "district" || field.name === "state") {
          value = formData.address[field.name];
        } else if (field.name === "medicationName") {
          value = formData.medication.name;
        } else if (field.name === "medicationFrequency") {
          value = formData.medication.frequency;
        } else {
          value = formData[field.name];
        }
        return (
          <Input
            type="text"
            label={field.name.charAt(0).toUpperCase() + field.name.slice(1)}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            errorMessage={errors[field.name]}
            isInvalid={!!errors[field.name]}
          />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-8"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Register</h2>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className={`w-1/5 h-2 rounded ${index <= currentStep ? 'bg-blue-500' : 'bg-gray-300'}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: index <= currentStep ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />
            ))}
          </div>
          <p className="text-center font-semibold">{steps[currentStep].title}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {steps[currentStep].fields.map((field) => (
              <div key={field.name} className="mb-4">
                {renderField(field)}
              </div>
            ))}
          </motion.div>
          <div className="flex justify-between mt-6">
            <Button onClick={prevStep} disabled={currentStep === 0 || isSubmitting}>Previous</Button>
            <Button 
              type={currentStep === steps.length - 1 ? "submit" : "button"} 
              color={currentStep === steps.length - 1 ? "primary" : "default"}
              onClick={currentStep === steps.length - 1 ? handleSubmit : nextStep}
              disabled={isSubmitting}
            >
              {currentStep === steps.length - 1 ? (isSubmitting ? "Registering..." : "Register") : "Next"}
            </Button>
          </div>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm">Already have an account? <Link href="/login" className="text-blue-500">Login</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
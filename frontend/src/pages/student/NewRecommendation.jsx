import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { recommendationAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, addDays, isWeekend } from 'date-fns';
import { ArrowLeft, CalendarIcon, Loader2, Send, Award, Plus, Trash2, AlertCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const getMinimumDate = () => {
  let date = new Date();
  let workingDays = 0;
  while (workingDays < 5) {
    date = addDays(date, 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) workingDays++;
  }
  return date;
};

const isDateDisabled = (date, minDate) => {
  if (date < minDate) return true;
  if (isWeekend(date)) return true;
  return false;
};

const EXTERNAL_EXAM_OPTIONS = ['Not Applicable', 'GCE', 'CSEC', 'CAPE 1', 'CAPE 2', 'Other'];

export default function NewRecommendation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [neededByDate, setNeededByDate] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState(null);
  const minimumDate = useMemo(() => getMinimumDate(), []);
  const [yearsAttended, setYearsAttended] = useState([{ from_year: '', to_year: '' }]);

  // External exams state
  const [selectedExams, setSelectedExams] = useState([]);

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    wolmers_email: user?.email || '',
    personal_email: '',
    phone_number: '',
    address: '',
    enrollment_status: '',
    last_form_class: '',
    co_curricular_activities: '',
    reason: '',
    other_reason: '',
    institution_name: '',
    institution_address: '',
    directed_to: '',
    program_name: '',
    collection_method: '',
    delivery_address: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const addYearRange = () => setYearsAttended([...yearsAttended, { from_year: '', to_year: '' }]);
  const removeYearRange = (index) => {
    if (yearsAttended.length > 1) setYearsAttended(yearsAttended.filter((_, i) => i !== index));
  };
  const updateYearRange = (index, field, value) => {
    const updated = [...yearsAttended];
    updated[index][field] = value;
    setYearsAttended(updated);
  };

  // External exams handlers
  const toggleExam = (examName) => {
    if (examName === 'Not Applicable') {
      const alreadySelected = selectedExams.some(e => e.exam === 'Not Applicable');
      setSelectedExams(alreadySelected ? [] : [{ exam: 'Not Applicable', year: '' }]);
      return;
    }
    const withoutNA = selectedExams.filter(e => e.exam !== 'Not Applicable');
    if (withoutNA.some(e => e.exam === examName)) {
      setSelectedExams(withoutNA.filter(e => e.exam !== examName));
    } else {
      setSelectedExams([...withoutNA, { exam: examName, year: '', ...(examName === 'Other' ? { name: '' } : {}) }]);
    }
  };

  const updateExamYear = (examName, year) => {
    setSelectedExams(selectedExams.map(e => e.exam === examName ? { ...e, year } : e));
  };

  const updateExamOtherName = (name) => {
    setSelectedExams(selectedExams.map(e => e.exam === 'Other' ? { ...e, name } : e));
  };

  const isExamSelected = (examName) => selectedExams.some(e => e.exam === examName);
  const getExamEntry = (examName) => selectedExams.find(e => e.exam === examName);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!neededByDate) {
      toast.error('Please select a date by which you need the recommendation letter');
      return;
    }
    if (!dateOfBirth) {
      toast.error('Please select your date of birth');
      return;
    }

    const validYears = yearsAttended.filter(y => y.from_year && y.to_year);
    if (validYears.length === 0) {
      toast.error('Please add at least one year range for attendance');
      return;
    }

    if (formData.collection_method === 'delivery' && !formData.delivery_address) {
      toast.error('Please enter a delivery address');
      return;
    }

    if (!formData.reason) {
      toast.error('Please select a reason for the request');
      return;
    }

    if (formData.reason === 'Other' && !formData.other_reason.trim()) {
      toast.error('Please specify your reason for the request');
      return;
    }

    const requiredFields = [
      'first_name', 'last_name', 'personal_email', 'phone_number', 'address',
      'last_form_class', 'institution_name', 'institution_address', 'program_name',
      'collection_method', 'reason', 'enrollment_status'
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    // Validate external exams
    if (selectedExams.length === 0) {
      toast.error('Please select at least one external exam (or "Not Applicable")');
      return;
    }
    const notApplicable = selectedExams.some(e => e.exam === 'Not Applicable');
    if (!notApplicable) {
      for (const exam of selectedExams) {
        if (!exam.year) {
          toast.error(`Please select the year for ${exam.exam}`);
          return;
        }
        if (exam.exam === 'Other' && !exam.name?.trim()) {
          toast.error('Please enter the name of the "Other" exam');
          return;
        }
      }
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        date_of_birth: format(dateOfBirth, 'MM/dd/yyyy'),
        years_attended: validYears,
        needed_by_date: format(neededByDate, 'yyyy-MM-dd'),
        email: formData.personal_email,
        external_exams: notApplicable ? [{ exam: 'Not Applicable', year: '' }] : selectedExams,
      };
      await recommendationAPI.create(data);
      toast.success('Recommendation letter request submitted successfully!');
      navigate('/student');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const examYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-stone-50 safe-area-inset" data-testid="new-recommendation-page">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 sm:h-16">
            <Link to="/student/select-service" className="flex items-center gap-2 text-stone-600 hover:text-maroon-500 touch-target">
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Service Selection</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8 flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-gold-600" />
          </div>
          <div>
            <h1 className="font-heading text-lg sm:text-2xl md:text-3xl font-bold text-stone-900">
              New Recommendation Letter Request
            </h1>
            <p className="text-sm sm:text-base text-stone-600">Fill out the form below to request a letter of recommendation</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} data-testid="recommendation-request-form">

          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Personal Information</CardTitle>
              <CardDescription>Enter your full name as it should appear on the letter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required placeholder="John" data-testid="first-name-input" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input id="middle_name" name="middle_name" value={formData.middle_name} onChange={handleChange} placeholder="Michael" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Doe" data-testid="last-name-input" />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full md:w-1/2 justify-start text-left font-normal", !dateOfBirth && "text-muted-foreground")} data-testid="dob-picker-trigger">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateOfBirth ? format(dateOfBirth, "MM/dd/yyyy") : "Select date of birth"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateOfBirth} onSelect={setDateOfBirth} disabled={(date) => date > new Date()} initialFocus captionLayout="dropdown-buttons" fromYear={1940} toYear={new Date().getFullYear()} />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-stone-500">Format: MM/DD/YYYY</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wolmers_email">Wolmer's Email</Label>
                  <Input id="wolmers_email" name="wolmers_email" type="email" value={formData.wolmers_email} onChange={handleChange} readOnly className="bg-stone-100" placeholder="firstname.lastname.year@wolmers.org" data-testid="wolmers-email-input" />
                  <p className="text-xs text-stone-500">Auto-filled from your sign-in account</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal_email">Personal Email *</Label>
                  <Input id="personal_email" name="personal_email" type="email" value={formData.personal_email} onChange={handleChange} required placeholder="your.personal@email.com" data-testid="personal-email-input" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input id="phone_number" name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} required placeholder="+1 876 XXX XXXX" data-testid="phone-input" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Your Address *</Label>
                <Textarea id="address" name="address" value={formData.address} onChange={handleChange} required placeholder="Enter your full residential address" rows={2} data-testid="address-input" />
              </div>
            </CardContent>
          </Card>

          {/* School History */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Wolmer's School History</CardTitle>
              <CardDescription>Provide details about your time at Wolmer's Boys' School</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Years Attended */}
              <div className="space-y-3">
                <Label>Years Attended *</Label>
                {yearsAttended.map((yearRange, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Select value={yearRange.from_year} onValueChange={(value) => updateYearRange(index, 'from_year', value)}>
                        <SelectTrigger><SelectValue placeholder="From Year" /></SelectTrigger>
                        <SelectContent>{years.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={yearRange.to_year} onValueChange={(value) => updateYearRange(index, 'to_year', value)}>
                        <SelectTrigger><SelectValue placeholder="To Year" /></SelectTrigger>
                        <SelectContent>{years.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {yearsAttended.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeYearRange(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addYearRange} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />Add Another Year Range
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_form_class">Last Form Class *</Label>
                <Input
                  id="last_form_class"
                  name="last_form_class"
                  value={formData.last_form_class}
                  onChange={handleChange}
                  required
                  placeholder="E.g., 5W, 4R, 6AG2, 3M"
                  data-testid="last-form-class-input"
                />
              </div>

              {/* Co-curricular Activities */}
              <div className="space-y-2">
                <Label htmlFor="co_curricular_activities">Positions of Responsibility / Co-curricular Activities</Label>
                <Textarea id="co_curricular_activities" name="co_curricular_activities" value={formData.co_curricular_activities} onChange={handleChange} placeholder="E.g., Head Boy, Prefect, Captain of Football Team, Member of Debate Club, etc." rows={3} />
                <p className="text-xs text-stone-500">List any leadership positions, clubs, teams, or activities you participated in</p>
              </div>

              {/* Enrollment Status */}
              <div className="space-y-2">
                <Label htmlFor="enrollment_status">Current Enrollment Status *</Label>
                <Select value={formData.enrollment_status} onValueChange={(value) => handleSelectChange('enrollment_status', value)} required>
                  <SelectTrigger id="enrollment_status" data-testid="enrollment-status-select">
                    <SelectValue placeholder="Select your enrollment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enrolled">Currently Enrolled</SelectItem>
                    <SelectItem value="Graduate">Graduate/Alumni</SelectItem>
                    <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* External Exams */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold-600" />
                External Examinations *
              </CardTitle>
              <CardDescription>Select all external examinations taken. For each, specify the year.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {EXTERNAL_EXAM_OPTIONS.map((examName) => {
                  const isSelected = isExamSelected(examName);
                  const examEntry = getExamEntry(examName);
                  const isNA = examName === 'Not Applicable';
                  const isDisabledByNA = !isNA && selectedExams.some(e => e.exam === 'Not Applicable');

                  return (
                    <div key={examName} className={cn("rounded-lg border p-3 transition-colors", isSelected ? "border-gold-300 bg-gold-50" : "border-stone-200 bg-white", isDisabledByNA && "opacity-40 cursor-not-allowed")}>
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`exam-rec-${examName}`}
                          checked={isSelected}
                          onCheckedChange={() => !isDisabledByNA && toggleExam(examName)}
                          disabled={isDisabledByNA}
                          className="data-[state=checked]:bg-gold-600 data-[state=checked]:border-gold-600"
                        />
                        <Label htmlFor={`exam-rec-${examName}`} className={cn("font-medium cursor-pointer", isDisabledByNA && "cursor-not-allowed")}>
                          {examName}
                        </Label>
                      </div>

                      {isSelected && !isNA && (
                        <div className="mt-3 ml-7 space-y-2">
                          {examName === 'Other' && (
                            <div className="space-y-1">
                              <Label className="text-sm text-stone-600">Name of Exam *</Label>
                              <Input
                                value={examEntry?.name || ''}
                                onChange={(e) => updateExamOtherName(e.target.value)}
                                placeholder="Enter the name of the exam"
                                className="h-8 text-sm"
                              />
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-sm text-stone-600">Year Taken *</Label>
                            <Select value={examEntry?.year || ''} onValueChange={(value) => updateExamYear(examName, value)}>
                              <SelectTrigger className="h-8 text-sm w-40">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                {examYears.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedExams.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Please select at least one option
                </p>
              )}
            </CardContent>
          </Card>

          {/* Institution Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Destination Institution</CardTitle>
              <CardDescription>Where should the recommendation letter be sent?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution_name">Institution Name *</Label>
                <Input id="institution_name" name="institution_name" value={formData.institution_name} onChange={handleChange} required placeholder="e.g., University of the West Indies" data-testid="institution-name-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution_address">Institution Full Address *</Label>
                <Textarea id="institution_address" name="institution_address" value={formData.institution_address} onChange={handleChange} required placeholder="Enter the complete address including city and country" rows={3} data-testid="institution-address-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="directed_to">Whom Should the Letter Be Directed To?</Label>
                <Input id="directed_to" name="directed_to" value={formData.directed_to} onChange={handleChange} placeholder="e.g., Admissions Committee, Dr. Smith (if applicable)" data-testid="directed-to-input" />
                <p className="text-xs text-stone-500">Leave blank if not applicable</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="program_name">Program Name *</Label>
                <Input id="program_name" name="program_name" value={formData.program_name} onChange={handleChange} required placeholder="e.g., Bachelor of Science in Computer Science" data-testid="program-name-input" />
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Request Details</CardTitle>
              <CardDescription>When do you need the letter and how should we deliver it?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Request *</Label>
                <Select value={formData.reason} onValueChange={(value) => handleSelectChange('reason', value)}>
                  <SelectTrigger data-testid="reason-select"><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="University application">University Application</SelectItem>
                    <SelectItem value="Employment">Employment</SelectItem>
                    <SelectItem value="Scholarship application">Scholarship Application</SelectItem>
                    <SelectItem value="Graduate school">Graduate School Application</SelectItem>
                    <SelectItem value="Professional certification">Professional Certification</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.reason === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="other_reason">Please Specify Your Reason *</Label>
                  <Textarea id="other_reason" name="other_reason" value={formData.other_reason} onChange={handleChange} required placeholder="Please describe your reason for requesting the recommendation letter..." rows={3} data-testid="other-reason-input" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Needed By *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !neededByDate && "text-muted-foreground")} data-testid="date-picker-trigger">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {neededByDate ? format(neededByDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={neededByDate} onSelect={setNeededByDate} disabled={(date) => isDateDisabled(date, minimumDate)} initialFocus />
                      <p className="text-xs text-stone-500 p-3 border-t">Minimum 5 working days required. Weekends are not available.</p>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection_method">Method of Collection *</Label>
                  <Select value={formData.collection_method} onValueChange={(value) => handleSelectChange('collection_method', value)}>
                    <SelectTrigger data-testid="collection-method-select"><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Picked Up at School</SelectItem>
                      <SelectItem value="emailed">Emailed to Institution</SelectItem>
                      <SelectItem value="delivery">Courier Delivery Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Courier Service Warning - DHL */}
              {formData.collection_method === 'delivery' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Paid Service Notice</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Courier Delivery Service is a paid service offered by DHL. All local delivery charges apply and will be communicated to you before dispatch. DHL DOES NOT DELIVER TO P.O. BOX ADDRESSES.
                    </p>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              {formData.collection_method === 'delivery' && (
                <div className="space-y-2">
                  <Label htmlFor="delivery_address">Delivery Address *</Label>
                  <Textarea
                    id="delivery_address"
                    name="delivery_address"
                    value={formData.delivery_address}
                    onChange={handleChange}
                    required
                    placeholder="Enter the complete delivery address, including street, city, parish/state, and ZIP code where applicable"
                    rows={3}
                    data-testid="delivery-address-input"
                  />
                  <p className="text-xs text-stone-500">Enter the complete delivery address, including street, city, parish/state, and ZIP code where applicable</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link to="/student/select-service">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-gold-500 hover:bg-gold-600 text-stone-900" data-testid="submit-request-btn">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" />Submit Request</>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

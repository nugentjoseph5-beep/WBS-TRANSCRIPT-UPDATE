import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { format, parseISO } from 'date-fns';
import { ArrowLeft, CalendarIcon, Loader2, Send, Award, Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXTERNAL_EXAM_OPTIONS = ['Not Applicable', 'GCE', 'CSEC', 'CAPE 1', 'CAPE 2', 'Other'];

export default function EditRecommendation() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [neededByDate, setNeededByDate] = useState(null);
  const [yearsAttended, setYearsAttended] = useState([{ from_year: '', to_year: '' }]);
  const [selectedExams, setSelectedExams] = useState([]);

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
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

  useEffect(() => {
    fetchRecommendation();
  }, [id]);

  const fetchRecommendation = async () => {
    try {
      const res = await recommendationAPI.getById(id);
      const data = res.data;

      if (data.status !== 'Pending' && data.status !== 'In Progress') {
        toast.error(`You cannot edit requests at the '${data.status}' stage. Please contact administration for assistance.`);
        navigate(`/student/recommendation/${id}`);
        return;
      }

      setFormData({
        first_name: data.first_name || '',
        middle_name: data.middle_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        address: data.address || '',
        enrollment_status: data.enrollment_status || '',
        last_form_class: data.last_form_class || '',
        co_curricular_activities: data.co_curricular_activities || '',
        reason: data.reason || '',
        other_reason: data.other_reason || '',
        institution_name: data.institution_name || '',
        institution_address: data.institution_address || '',
        directed_to: data.directed_to || '',
        program_name: data.program_name || '',
        collection_method: data.collection_method || '',
        delivery_address: data.delivery_address || '',
      });

      if (data.years_attended && Array.isArray(data.years_attended) && data.years_attended.length > 0) {
        setYearsAttended(data.years_attended);
      }

      if (data.external_exams && Array.isArray(data.external_exams) && data.external_exams.length > 0) {
        setSelectedExams(data.external_exams);
      }

      if (data.needed_by_date) {
        setNeededByDate(parseISO(data.needed_by_date));
      }

      setLoading(false);
    } catch (error) {
      toast.error('Failed to load recommendation details');
      navigate('/student');
    }
  };

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

    const validYears = yearsAttended.filter(y => y.from_year && y.to_year);
    if (validYears.length === 0) {
      toast.error('Please add at least one year range for attendance');
      return;
    }

    if (formData.collection_method === 'delivery' && !formData.delivery_address) {
      toast.error('Please enter a delivery address');
      return;
    }

    const requiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'address', 'last_form_class', 'institution_name', 'institution_address', 'program_name', 'collection_method'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    // Validate external exams
    const notApplicable = selectedExams.some(e => e.exam === 'Not Applicable');
    if (!notApplicable && selectedExams.length > 0) {
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

    setSaving(true);
    try {
      const data = {
        ...formData,
        years_attended: validYears,
        needed_by_date: format(neededByDate, 'yyyy-MM-dd'),
        external_exams: selectedExams,
      };
      await recommendationAPI.update(id, data);
      toast.success('Recommendation letter request updated successfully!');
      navigate(`/student/recommendation/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit request');
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const examYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-stone-50" data-testid="edit-recommendation-page">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to={`/student/recommendation/${id}`} className="flex items-center gap-2 text-stone-600 hover:text-maroon-500">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Detail</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center gap-4">
              <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-gold-600" />
              </div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-stone-900">Edit Recommendation Letter Request</h1>
                <p className="text-stone-600">Update your recommendation letter request details</p>
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
                      <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middle_name">Middle Name</Label>
                      <Input id="middle_name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Phone Number *</Label>
                      <Input id="phone_number" name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Your Address *</Label>
                    <Textarea id="address" name="address" value={formData.address} onChange={handleChange} required rows={2} />
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
                    <Button type="button" variant="outline" size="sm" onClick={addYearRange}>
                      <Plus className="h-4 w-4 mr-2" />Add Another Year Range
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_form_class">Last Form Class *</Label>
                    <Input id="last_form_class" name="last_form_class" value={formData.last_form_class} onChange={handleChange} required placeholder="E.g., 5W, 4R, 6AG2, 3M" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="co_curricular_activities">Positions of Responsibility / Co-curricular Activities</Label>
                    <Textarea id="co_curricular_activities" name="co_curricular_activities" value={formData.co_curricular_activities} onChange={handleChange} rows={3} placeholder="E.g., Head Boy, Prefect, Captain of Football Team, Member of Debate Club, etc." />
                    <p className="text-xs text-stone-500">List any leadership positions, clubs, teams, or activities you participated in</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enrollment_status">Current Enrollment Status *</Label>
                    <Select value={formData.enrollment_status} onValueChange={(value) => handleSelectChange('enrollment_status', value)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Enrolled">Currently Enrolled</SelectItem>
                        <SelectItem value="Graduate">Graduate/Alumni</SelectItem>
                        <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* External Examinations */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-gold-600" />
                    External Examinations
                  </CardTitle>
                  <CardDescription>Select all external examinations taken. For each, specify the year.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {EXTERNAL_EXAM_OPTIONS.map((examName) => {
                    const isSelected = isExamSelected(examName);
                    const examEntry = getExamEntry(examName);
                    const isNA = examName === 'Not Applicable';
                    const isDisabledByNA = !isNA && selectedExams.some(e => e.exam === 'Not Applicable');
                    return (
                      <div key={examName} className={cn("rounded-lg border p-3 transition-colors", isSelected ? "border-gold-300 bg-gold-50" : "border-stone-200 bg-white", isDisabledByNA && "opacity-40 cursor-not-allowed")}>
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`edit-rec-exam-${examName}`}
                            checked={isSelected}
                            onCheckedChange={() => !isDisabledByNA && toggleExam(examName)}
                            disabled={isDisabledByNA}
                            className="data-[state=checked]:bg-gold-600 data-[state=checked]:border-gold-600"
                          />
                          <Label htmlFor={`edit-rec-exam-${examName}`} className={cn("font-medium cursor-pointer", isDisabledByNA && "cursor-not-allowed")}>{examName}</Label>
                        </div>
                        {isSelected && !isNA && (
                          <div className="mt-3 ml-7 space-y-2">
                            {examName === 'Other' && (
                              <div className="space-y-1">
                                <Label className="text-sm text-stone-600">Name of Exam *</Label>
                                <Input value={examEntry?.name || ''} onChange={(e) => updateExamOtherName(e.target.value)} placeholder="Enter the name of the exam" className="h-8 text-sm" />
                              </div>
                            )}
                            <div className="space-y-1">
                              <Label className="text-sm text-stone-600">Year Taken *</Label>
                              <Select value={examEntry?.year || ''} onValueChange={(value) => updateExamYear(examName, value)}>
                                <SelectTrigger className="h-8 text-sm w-40"><SelectValue placeholder="Select year" /></SelectTrigger>
                                <SelectContent>{examYears.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    <Input id="institution_name" name="institution_name" value={formData.institution_name} onChange={handleChange} required placeholder="e.g., University of the West Indies" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution_address">Institution Full Address *</Label>
                    <Textarea id="institution_address" name="institution_address" value={formData.institution_address} onChange={handleChange} required rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="directed_to">Whom Should the Letter Be Directed To?</Label>
                    <Input id="directed_to" name="directed_to" value={formData.directed_to} onChange={handleChange} placeholder="e.g., Admissions Committee (if applicable)" />
                    <p className="text-xs text-stone-500">Leave blank if not applicable</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program_name">Program Name *</Label>
                    <Input id="program_name" name="program_name" value={formData.program_name} onChange={handleChange} required placeholder="e.g., Bachelor of Science in Computer Science" />
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
                      <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
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
                      <Textarea id="other_reason" name="other_reason" value={formData.other_reason} onChange={handleChange} required rows={3} />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date Needed By *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !neededByDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {neededByDate ? format(neededByDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={neededByDate} onSelect={setNeededByDate} disabled={(date) => date < new Date()} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="collection_method">Method of Collection *</Label>
                      <Select value={formData.collection_method} onValueChange={(value) => handleSelectChange('collection_method', value)}>
                        <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">Picked Up at School</SelectItem>
                          <SelectItem value="emailed">Emailed to Institution</SelectItem>
                          <SelectItem value="delivery">Courier Delivery Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.collection_method === 'delivery' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Paid Service Notice</p>
                        <p className="text-sm text-amber-700 mt-1">Courier Delivery Service is a paid service offered by DHL. All local delivery charges apply and will be communicated to you before dispatch. DHL DOES NOT DELIVER TO P.O. BOX ADDRESSES.</p>
                      </div>
                    </div>
                  )}

                  {formData.collection_method === 'delivery' && (
                    <div className="space-y-2">
                      <Label htmlFor="delivery_address">Delivery Address *</Label>
                      <Textarea id="delivery_address" name="delivery_address" value={formData.delivery_address} onChange={handleChange} required placeholder="Enter the complete delivery address, including street, city, parish/state, and ZIP code where applicable" rows={3} />
                      <p className="text-xs text-stone-500">Enter the complete delivery address, including street, city, parish/state, and ZIP code where applicable</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Link to={`/student/recommendation/${id}`}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit" disabled={saving} className="bg-gold-500 hover:bg-gold-600 text-stone-900" data-testid="submit-request-btn">
                  {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>) : (<><Send className="mr-2 h-4 w-4" />Update Request</>)}
                </Button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

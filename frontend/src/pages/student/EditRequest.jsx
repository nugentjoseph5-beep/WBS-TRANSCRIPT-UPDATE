import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { requestAPI } from '@/lib/api';
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
import { ArrowLeft, CalendarIcon, Loader2, Save, BookOpen, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const EXTERNAL_EXAM_OPTIONS = ['Not Applicable', 'GCE', 'CSEC', 'CAPE 1', 'CAPE 2', 'Other'];

export default function EditRequest() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [neededByDate, setNeededByDate] = useState(null);
  const [request, setRequest] = useState(null);
  const [academicYears, setAcademicYears] = useState([{ from_year: '', to_year: '' }]);
  const [selectedExams, setSelectedExams] = useState([]);

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    school_id: '',
    enrollment_status: '',
    wolmers_email: '',
    personal_email: '',
    phone_number: '',
    last_form_class: '',
    reason: '',
    other_reason: '',
    collection_method: '',
    delivery_address: '',
    institution_name: '',
    institution_address: '',
    institution_phone: '',
    institution_email: '',
    number_of_copies: 1,
    received_transcript_before: '',
  });

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const res = await requestAPI.getById(id);
      const data = res.data;

      if (data.status !== 'Pending') {
        toast.error(`This request cannot be edited because its status is '${data.status}'. Only pending requests can be modified.`);
        navigate(`/student/request/${id}`);
        return;
      }

      setRequest(data);
      setFormData({
        first_name: data.first_name || '',
        middle_name: data.middle_name || '',
        last_name: data.last_name || '',
        school_id: data.school_id || '',
        enrollment_status: data.enrollment_status || '',
        wolmers_email: data.wolmers_email || '',
        personal_email: data.personal_email || '',
        phone_number: data.phone_number || '',
        last_form_class: data.last_form_class || '',
        reason: data.reason || '',
        other_reason: data.other_reason || '',
        collection_method: data.collection_method || '',
        delivery_address: data.delivery_address || '',
        institution_name: data.institution_name || '',
        institution_address: data.institution_address || '',
        institution_phone: data.institution_phone || '',
        institution_email: data.institution_email || '',
        number_of_copies: data.number_of_copies || 1,
        received_transcript_before: data.received_transcript_before || '',
      });

      // Load academic years
      if (data.academic_years && Array.isArray(data.academic_years) && data.academic_years.length > 0) {
        setAcademicYears(data.academic_years);
      }

      // Load external exams
      if (data.external_exams && Array.isArray(data.external_exams) && data.external_exams.length > 0) {
        setSelectedExams(data.external_exams);
      }

      if (data.needed_by_date) {
        setNeededByDate(parseISO(data.needed_by_date));
      }
    } catch (error) {
      toast.error('Failed to load request');
      navigate('/student');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  // Academic year handlers
  const addAcademicYear = () => setAcademicYears([...academicYears, { from_year: '', to_year: '' }]);
  const removeAcademicYear = (index) => {
    if (academicYears.length > 1) setAcademicYears(academicYears.filter((_, i) => i !== index));
  };
  const updateAcademicYear = (index, field, value) => {
    const updated = [...academicYears];
    updated[index][field] = value;
    setAcademicYears(updated);
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
      toast.error('Please select a date by which you need the transcript');
      return;
    }

    if (!formData.last_form_class.trim()) {
      toast.error('Please enter your last form class');
      return;
    }

    const validYears = academicYears.filter(y => y.from_year && y.to_year);
    if (validYears.length === 0) {
      toast.error('Please add at least one academic year range');
      return;
    }

    if (formData.collection_method === 'delivery' && !formData.delivery_address) {
      toast.error('Please enter a delivery address');
      return;
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
        academic_years: validYears,
        needed_by_date: format(neededByDate, 'yyyy-MM-dd'),
        number_of_copies: parseInt(formData.number_of_copies) || 1,
        external_exams: selectedExams,
      };
      await requestAPI.editAsStudent(id, data);
      toast.success('Request updated successfully!');
      navigate(`/student/request/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update request');
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);
  const examYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="edit-request-page">
      {/* Header */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to={`/student/request/${id}`} className="flex items-center gap-2 text-stone-600 hover:text-maroon-500">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Request</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-stone-900 mb-2">Edit Transcript Request</h1>
          <p className="text-stone-600">Update your request details below</p>
        </div>

        <form onSubmit={handleSubmit} data-testid="edit-request-form">
          {/* Personal Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Personal Information</CardTitle>
              <CardDescription>Enter your name as it appears on official records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required data-testid="edit-first-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input id="middle_name" name="middle_name" value={formData.middle_name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required data-testid="edit-last-name" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="school_id">School ID Number</Label>
                  <Input id="school_id" name="school_id" value={formData.school_id} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrollment_status">Enrollment Status *</Label>
                  <Select value={formData.enrollment_status} onValueChange={(value) => handleSelectChange('enrollment_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled">Currently Enrolled</SelectItem>
                      <SelectItem value="graduate">Graduate/Alumni</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Academic Years */}
              <div className="space-y-3">
                <Label>Academic Years for Transcript *</Label>
                {academicYears.map((yearRange, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Select value={yearRange.from_year} onValueChange={(value) => updateAcademicYear(index, 'from_year', value)}>
                        <SelectTrigger><SelectValue placeholder="From Year" /></SelectTrigger>
                        <SelectContent>{years.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select value={yearRange.to_year} onValueChange={(value) => updateAcademicYear(index, 'to_year', value)}>
                        <SelectTrigger><SelectValue placeholder="To Year" /></SelectTrigger>
                        <SelectContent>{years.map((year) => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    {academicYears.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeAcademicYear(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addAcademicYear}>
                  <Plus className="h-4 w-4 mr-2" />Add Another Year Range
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wolmers_email">Wolmer's Email</Label>
                <Input id="wolmers_email" name="wolmers_email" type="email" value={formData.wolmers_email} readOnly className="bg-stone-100" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personal_email">Personal Email *</Label>
                  <Input id="personal_email" name="personal_email" type="email" value={formData.personal_email} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input id="phone_number" name="phone_number" type="tel" value={formData.phone_number} onChange={handleChange} required />
                </div>
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
                />
              </div>
            </CardContent>
          </Card>

          {/* External Examinations */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-maroon-600" />
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
                  <div key={examName} className={cn("rounded-lg border p-3 transition-colors", isSelected ? "border-maroon-300 bg-maroon-50" : "border-stone-200 bg-white", isDisabledByNA && "opacity-40 cursor-not-allowed")}>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`edit-exam-${examName}`}
                        checked={isSelected}
                        onCheckedChange={() => !isDisabledByNA && toggleExam(examName)}
                        disabled={isDisabledByNA}
                        className="data-[state=checked]:bg-maroon-600 data-[state=checked]:border-maroon-600"
                      />
                      <Label htmlFor={`edit-exam-${examName}`} className={cn("font-medium cursor-pointer", isDisabledByNA && "cursor-not-allowed")}>{examName}</Label>
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

          {/* Request Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Request Details</CardTitle>
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
                    <SelectItem value="Transfer">Transfer to Another School</SelectItem>
                    <SelectItem value="Personal records">Personal Records</SelectItem>
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
                  <Label htmlFor="number_of_copies">Number of Copies Requesting *</Label>
                  <Input id="number_of_copies" name="number_of_copies" type="number" min="1" max="20" value={formData.number_of_copies} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Have You Received a Transcript Before? *</Label>
                  <Select value={formData.received_transcript_before} onValueChange={(value) => handleSelectChange('received_transcript_before', value)}>
                    <SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YES">Yes</SelectItem>
                      <SelectItem value="NO">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
                  <Label htmlFor="collection_method">Collection Method *</Label>
                  <Select value={formData.collection_method} onValueChange={(value) => handleSelectChange('collection_method', value)}>
                    <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup at Bursary</SelectItem>
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

          {/* Institution Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Institution Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="institution_name">Institution Name *</Label>
                <Input id="institution_name" name="institution_name" value={formData.institution_name} onChange={handleChange} required placeholder="e.g., University of the West Indies" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution_address">Institution Address *</Label>
                <Textarea id="institution_address" name="institution_address" value={formData.institution_address} onChange={handleChange} required rows={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="institution_phone">Institution Phone *</Label>
                  <Input id="institution_phone" name="institution_phone" type="tel" value={formData.institution_phone} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institution_email">Institution Email *</Label>
                  <Input id="institution_email" name="institution_email" type="email" value={formData.institution_email} onChange={handleChange} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link to={`/student/request/${id}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving} className="bg-maroon-500 hover:bg-maroon-600" data-testid="save-changes-btn">
              {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : (<><Save className="mr-2 h-4 w-4" />Save Changes</>)}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

/**
 * Monarch Form Component
 * 
 * Extracted from admin-db.tsx to improve maintainability.
 * Handles the creation and editing of monarchs with validation.
 */

import React from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type Monarch } from '@/types/family';
import { processMonarchFormData } from '@/lib/admin-validation-utils';

interface MonarchFormProps {
  editingMonarch: Monarch | null;
  isAddingNewMonarch: boolean;
  monarchValidationErrors: Record<string, string>;
  setMonarchValidationErrors: (errors: Record<string, string>) => void;
  isSubmittingMonarch: boolean;
  setIsSubmittingMonarch: (submitting: boolean) => void;
  onSubmit: (monarchData: Monarch, isNew: boolean) => Promise<void>;
  onCancel: () => void;
  validateMonarchData: (monarchData: Monarch) => Record<string, string>;
}

export function MonarchForm({
  editingMonarch,
  isAddingNewMonarch,
  monarchValidationErrors,
  setMonarchValidationErrors,
  isSubmittingMonarch,
  setIsSubmittingMonarch,
  onSubmit,
  onCancel,
  validateMonarchData,
}: MonarchFormProps) {

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingMonarch) return;

    setIsSubmittingMonarch(true);
    setMonarchValidationErrors({});

    try {
      const formData = new FormData(e.currentTarget);
      const monarchData = processMonarchFormData(formData);

      console.log('Monarch form submission data:', monarchData);

      // Validate monarch data
      const validationErrors = validateMonarchData(monarchData);
      if (Object.keys(validationErrors).length > 0) {
        setMonarchValidationErrors(validationErrors);
        setIsSubmittingMonarch(false);
        return;
      }

      await onSubmit(monarchData, isAddingNewMonarch);
    } catch (error) {
      console.error('Monarch form submission error:', error);
      setIsSubmittingMonarch(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monarchId">Monarch ID *</Label>
          <Input
            id="monarchId"
            name="id"
            defaultValue={editingMonarch?.id || ''}
            required
            className={monarchValidationErrors.id ? 'border-red-500' : ''}
            placeholder="e.g., gustav-i-vasa"
            {...(monarchValidationErrors.id && { 'aria-describedby': 'monarchId-error' })}
          />
          {monarchValidationErrors.id && (
            <p id="monarchId-error" className="text-sm text-red-600" role="alert">
              {monarchValidationErrors.id}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="monarchName">Name *</Label>
          <Input
            id="monarchName"
            name="name"
            defaultValue={editingMonarch?.name || ''}
            required
            className={monarchValidationErrors.name ? 'border-red-500' : ''}
            placeholder="e.g., Gustav I Vasa"
            {...(monarchValidationErrors.name && { 'aria-describedby': 'monarchName-error' })}
          />
          {monarchValidationErrors.name && (
            <p id="monarchName-error" className="text-sm text-red-600" role="alert">
              {monarchValidationErrors.name}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monarchBorn">Born (ISO Date)</Label>
          <Input
            id="monarchBorn"
            name="born"
            type="date"
            defaultValue={editingMonarch?.born || ''}
            className={monarchValidationErrors.born ? 'border-red-500' : ''}
            {...(monarchValidationErrors.born && { 'aria-describedby': 'monarchBorn-error' })}
          />
          {monarchValidationErrors.born && (
            <p id="monarchBorn-error" className="text-sm text-red-600" role="alert">
              {monarchValidationErrors.born}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="monarchDied">Died (ISO Date)</Label>
          <Input
            id="monarchDied"
            name="died"
            type="date"
            defaultValue={editingMonarch?.died || ''}
            className={monarchValidationErrors.died ? 'border-red-500' : ''}
            {...(monarchValidationErrors.died && { 'aria-describedby': 'monarchDied-error' })}
          />
          {monarchValidationErrors.died && (
            <p id="monarchDied-error" className="text-sm text-red-600" role="alert">
              {monarchValidationErrors.died}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="reignFrom">Reign From (ISO Date) *</Label>
          <Input
            id="reignFrom"
            name="reignFrom"
            type="date"
            defaultValue={editingMonarch?.reignFrom || ''}
            required
            className={monarchValidationErrors.reignFrom ? 'border-red-500' : ''}
            {...(monarchValidationErrors.reignFrom && { 'aria-describedby': 'reignFrom-error' })}
          />
          {monarchValidationErrors.reignFrom && (
            <p id="reignFrom-error" className="text-sm text-red-600" role="alert">
              {monarchValidationErrors.reignFrom}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="reignTo">Reign To (ISO Date) *</Label>
          <Input
            id="reignTo"
            name="reignTo"
            type="date"
            defaultValue={editingMonarch?.reignTo || ''}
            required
            className={monarchValidationErrors.reignTo ? 'border-red-500' : ''}
            {...(monarchValidationErrors.reignTo && { 'aria-describedby': 'reignTo-error' })}
          />
          {monarchValidationErrors.reignTo && (
            <p id="reignTo-error" className="text-sm text-red-600" role="alert">
              {monarchValidationErrors.reignTo}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="portraitFileName">Portrait File Name</Label>
        <Input
          id="portraitFileName"
          name="portraitFileName"
          defaultValue={editingMonarch?.portraitFileName || ''}
          className={monarchValidationErrors.portraitFileName ? 'border-red-500' : ''}
          placeholder="e.g., gustav-vasa-portrait.jpg"
          {...(monarchValidationErrors.portraitFileName && { 'aria-describedby': 'portraitFileName-error' })}
        />
        {monarchValidationErrors.portraitFileName && (
          <p id="portraitFileName-error" className="text-sm text-red-600" role="alert">
            {monarchValidationErrors.portraitFileName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="monarchQuote">Famous Quote</Label>
        <Textarea
          id="monarchQuote"
          name="quote"
          defaultValue={editingMonarch?.quote || ''}
          rows={2}
          className={monarchValidationErrors.quote ? 'border-red-500' : ''}
          placeholder="A famous quote or saying by the monarch..."
          {...(monarchValidationErrors.quote && { 'aria-describedby': 'monarchQuote-error' })}
        />
        {monarchValidationErrors.quote && (
          <p id="monarchQuote-error" className="text-sm text-red-600" role="alert">
            {monarchValidationErrors.quote}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="monarchAbout">About / Biography</Label>
        <Textarea
          id="monarchAbout"
          name="about"
          defaultValue={editingMonarch?.about || ''}
          rows={4}
          className={monarchValidationErrors.about ? 'border-red-500' : ''}
          placeholder="Historical information, achievements, important events during reign..."
          {...(monarchValidationErrors.about && { 'aria-describedby': 'monarchAbout-error' })}
        />
        {monarchValidationErrors.about && (
          <p id="monarchAbout-error" className="text-sm text-red-600" role="alert">
            {monarchValidationErrors.about}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmittingMonarch}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmittingMonarch}
          className="min-w-[140px]"
        >
          {isSubmittingMonarch ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isAddingNewMonarch ? 'Adding...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {isAddingNewMonarch ? 'Add Monarch' : 'Save Changes'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
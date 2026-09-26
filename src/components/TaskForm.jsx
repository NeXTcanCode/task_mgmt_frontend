import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Icon from './Icon';
import Modal from './Modal';
import { useAiSuggest, useCreateTask } from '../hooks/useTasks';
import { PRIORITIES, PRIORITY_LABELS } from '../utils/constants';
import { todayLocal } from '../utils/formatDate';
import { fieldErrorsFrom, setServerErrors, taskRules } from '../utils/validation';

const rawInputRules = { validate: (value) => Boolean(value.trim()) || 'Describe the task first' };

// Create task: natural language → (optional AI suggestion) → review → save
export default function TaskForm({ onCreated, onClose }) {
  const { register, handleSubmit, getValues, setValue, setError, clearErrors, trigger, watch, formState: { errors } } = useForm({
    defaultValues: { rawInput: '', title: '', description: '', priority: 'medium', dueDate: '' },
  });
  const [step, setStep] = useState('input'); // 'input' → 'review'
  const [aiGenerated, setAiGenerated] = useState(null); // true | false | null (not asked yet)
  const suggest = useAiSuggest();
  const create = useCreateTask();
  const dueDate = watch('dueDate');
  const showServerError = (error) => setServerErrors(setError, fieldErrorsFrom(error), error.message);

  const review = (title, description, generated) => {
    setValue('title', title);
    setValue('description', description);
    setAiGenerated(generated);
    clearErrors();
    setStep('review');
  };

  const askAi = async () => {
    if (!(await trigger('rawInput'))) return;
    suggest.mutate(getValues('rawInput').trim(), {
      onSuccess: (data) => review(data.title, data.description || '', data.aiGenerated),
      onError: showServerError,
    });
  };

  const skipAi = async () => {
    if (await trigger('rawInput')) review(getValues('rawInput').trim(), getValues('description'), null);
  };

  const save = (values) => create.mutate({
    title: values.title.trim(),
    description: values.description.trim(),
    rawInput: values.rawInput.trim() || undefined,
    priority: values.priority,
    dueDate: values.dueDate || null,
  }, { onSuccess: onCreated, onError: showServerError });

  const reviewing = step === 'review';
  const footer = reviewing
    ? <>
      <button type="button" className="btn btn-light" onClick={() => { clearErrors(); setStep('input'); }} disabled={create.isPending}>Back</button>
      <button type="submit" form="task-form" className="btn btn-primary" disabled={create.isPending}>
        {create.isPending && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}Save task
      </button>
    </>
    : <>
      <button type="button" className="btn btn-light" onClick={skipAi} disabled={suggest.isPending}>Use as is</button>
      <button type="button" className="btn btn-primary" onClick={askAi} disabled={suggest.isPending}>
        {suggest.isPending ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : <Icon name="sparkles" size={16} />} Suggest with AI
      </button>
    </>;

  return <Modal title="New task" onClose={onClose} footer={footer} fullscreenMobile>
    {errors.root && <div className="alert alert-danger py-2" role="alert">{errors.root.message}</div>}
    <form id="task-form" onSubmit={handleSubmit(save)} noValidate>
      {!reviewing && <div className="mb-2">
        <label htmlFor="rawInput" className="form-label">What do you need to do?</label>
        <textarea id="rawInput" rows={3} className={`form-control ${errors.rawInput ? 'is-invalid' : ''}`} {...register('rawInput', rawInputRules)} placeholder="e.g. follow up with designer about wireframes" maxLength={500} autoFocus />
        {errors.rawInput && <div className="invalid-feedback">{errors.rawInput.message}</div>}
        <div className="form-text">Write it in your own words. AI can turn it into a clear title and description.</div>
      </div>}

      {reviewing && <>
        {aiGenerated === true && <span className="badge ai-badge mb-3"><Icon name="sparkles" size={12} /> AI suggested: edit anything</span>}
        {aiGenerated === false && <div className="alert alert-warning py-2 small">AI unavailable, edit manually.</div>}
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title</label>
          <input id="title" className={`form-control ${errors.title ? 'is-invalid' : ''}`} {...register('title', taskRules.title)} maxLength={200} autoFocus />
          {errors.title && <div className="invalid-feedback">{errors.title.message}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">Description <span className="text-muted">(optional)</span></label>
          <textarea id="description" rows={3} className={`form-control ${errors.description ? 'is-invalid' : ''}`} {...register('description', taskRules.description)} maxLength={2000} />
          {errors.description && <div className="invalid-feedback">{errors.description.message}</div>}
        </div>
        <div className="row g-3">
          <div className="col-6">
            <label htmlFor="priority" className="form-label">Priority</label>
            <select id="priority" className="form-select" {...register('priority')}>
              {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}
            </select>
          </div>
          <div className="col-6">
            <label htmlFor="dueDate" className="form-label">Due date <span className="text-muted">(optional)</span></label>
            <input id="dueDate" type="date" className={`form-control ${errors.dueDate ? 'is-invalid' : ''}`} {...register('dueDate', taskRules.dueDate)} />
            {errors.dueDate && <div className="invalid-feedback">{errors.dueDate.message}</div>}
            {dueDate && dueDate < todayLocal() && <div className="form-text text-warning">This date is in the past</div>}
          </div>
        </div>
      </>}
    </form>
  </Modal>;
}

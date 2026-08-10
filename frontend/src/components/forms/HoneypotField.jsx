// A field no person ever sees or tabs to. If it gets filled, it was not a person.
import { useId } from 'react'

export default function HoneypotField({ value, onChange }) {
  const id = useId()

  return (
    <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={id}>Leave this field empty</label>
      <input
        id={id}
        name="company-website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

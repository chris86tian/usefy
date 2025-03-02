import type React from "react"
import { type ControllerRenderProps, type FieldValues, useFormContext, useFieldArray } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Edit, X, Plus } from "lucide-react"
import { registerPlugin } from "filepond"
import { FilePond } from "react-filepond"
import "filepond/dist/filepond.min.css"
import FilePondPluginImagePreview from "filepond-plugin-image-preview"
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation"
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css"
import { Checkbox } from "@/components/ui/checkbox"

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)

interface FormFieldProps {
  name: string
  label: string
  type?:
    | "text"
    | "email"
    | "textarea"
    | "number"
    | "select"
    | "switch"
    | "password"
    | "file"
    | "multi-input"
    | "checkbox"
  placeholder?: string
  options?: { value: string; label: string }[]
  accept?: string
  className?: string
  labelClassName?: string
  inputClassName?: string
  value?: string
  disabled?: boolean
  multiple?: boolean
  isIcon?: boolean
  initialValue?: string | number | boolean | string[]
}

export const CustomFormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = "text",
  placeholder,
  options,
  accept,
  className,
  inputClassName,
  labelClassName,
  disabled = false,
  multiple = false,
  isIcon = false,
  initialValue,
}) => {
  const { control } = useFormContext()

  const renderFormControl = (field: ControllerRenderProps<FieldValues, string>) => {
    switch (type) {
      case "textarea":
        return (
          <Textarea
            placeholder={placeholder}
            {...field}
            rows={3}
            className={`border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 ${inputClassName}`}
          />
        )
      case "select":
        return (
          <Select
            value={field.value || (initialValue as string)}
            defaultValue={field.value || (initialValue as string)}
            onValueChange={field.onChange}
          >
            <SelectTrigger className={`w-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 ${inputClassName}`}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="w-full bg-white dark:bg-gray-900 border-gray-400 dark:border-gray-700 shadow">
              {options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "switch":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              id={name}
              className="text-gray-500 dark:text-gray-300"
            />
            <FormLabel htmlFor={name} className={labelClassName}>
              {label}
            </FormLabel>
          </div>
        )
      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={name} checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )
      case "file":
        return (
          <FilePond
            className={`dark:text-white dark:bg-gray-800 ${inputClassName}`}
            files={field.value ? [field.value] : []}
            allowMultiple={multiple}
            onupdatefiles={(fileItems: any) => {
              field.onChange(multiple ? fileItems.map((fileItem: any) => fileItem.file) : fileItems[0]?.file)
            }}
            acceptedFileTypes={accept ? [accept] : undefined}
            labelIdle={`Drag & Drop your files or <span class="filepond--label-action">Browse</span>`}
            credits={false}
          />
        )
      default:
        return (
          <Input
            type={type}
            placeholder={placeholder}
            {...field}
            className={`border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 ${inputClassName}`}
            disabled={disabled}
          />
        )
    }
  }

  return (
    <FormField
      control={control}
      name={name}
      defaultValue={initialValue}
      render={({ field }) => (
        <FormItem className={`${type !== "switch" && "rounded-md"} relative ${className}`}>
          {type !== "switch" && (
            <div className="flex justify-between items-center">
              <FormLabel className={`text-gray-500 dark:text-gray-300 text-sm ${labelClassName}`}>{label}</FormLabel>
              {!disabled && isIcon && type !== "file" && type !== "multi-input" && (
                <Edit className="size-4 text-gray-500 dark:text-gray-300" />
              )}
            </div>
          )}
          <FormControl>
            {renderFormControl({
              ...field,
              value: field.value !== undefined ? field.value : initialValue,
            })}
          </FormControl>
          <FormMessage className="text-red-400" />
        </FormItem>
      )}
    />
  )
}

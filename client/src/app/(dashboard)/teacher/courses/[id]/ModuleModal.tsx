// import { CustomFormField } from "@/components/CustomFormField";
// import CustomModal from "@/components/CustomModal";
// import { Button } from "@/components/ui/button";
// import { Form } from "@/components/ui/form";
// import { ModuleFormData, moduleSchema } from "@/lib/schemas";
// import { addModule, closeModuleModal, editModule } from "@/state";
// import { useAppDispatch, useAppSelector } from "@/state/redux";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { X } from "lucide-react";
// import React, { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { toast } from "sonner";
// import { v4 as uuidv4 } from "uuid";

// const ModuleModal = () => {
//   const dispatch = useAppDispatch();
//   const { isModuleModalOpen, selectedModuleIndex, modules } = useAppSelector(
//     (state) => state.global.courseEditor
//   );

//   const module =
//     selectedModuleIndex !== null ? modules[selectedModuleIndex] : null;

//   const methods = useForm<ModuleFormData>({
//     resolver: zodResolver(moduleSchema),
//     defaultValues: {
//       title: "",
//       description: "",
//       video: "",
//     },
//   });

//   useEffect(() => {
//     if (module) {
//       methods.reset({
//         title: module.moduleTitle,
//         description: module.moduleDescription,
//       });
//     } else {
//       methods.reset({
//         title: "",
//         description: "",
//       });
//     }
//   }, [module, methods]);

//   const onClose = () => {
//     dispatch(closeModuleModal());
//   };

//   const onSubmit = (data: ModuleFormData) => {
//     const newModule: Module = {
//       moduleId: module?.moduleId || uuidv4(),
//       title: data.title,
//       description: data.description,
//       sections: module?.sections || [],
//     };

//     if (selectedModuleIndex === null) {
//       dispatch(addModule(newModule));
//     } else {
//       dispatch(
//         editModule({
//           index: selectedModuleIndex,
//           module: newModule,
//         })
//       );
//     }

//     toast.success(
//       `Module updated successfully but you need to save the course to apply the changes`
//     );
//     onClose();
//   };

//   return (
//     <CustomModal isOpen={isModuleModalOpen} onClose={onClose}>
//       <div className="module-modal">
//         <div className="module-modal__header">
//           <h2 className="module-modal__title">Add/Edit Module</h2>
//           <button onClick={onClose} className="module-modal__close">
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <Form {...methods}>
//           <form
//             onSubmit={methods.handleSubmit(onSubmit)}
//             className="module-modal__form"
//           >
//             <CustomFormField
//               name="title"
//               label="Module Title"
//               placeholder="Write module title here"
//             />

//             <CustomFormField
//               name="description"
//               label="Module Description"
//               type="textarea"
//               placeholder="Write module description here"
//             />

//             <div className="module-modal__actions">
//               <Button type="button" variant="outline" onClick={onClose}>
//                 Cancel
//               </Button>
//               <Button type="submit" className="bg-primary-700">
//                 Save
//               </Button>
//             </div>
//           </form>
//         </Form>
//       </div>
//     </CustomModal>
//   );
// };

// export default ModuleModal;

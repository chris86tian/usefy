import React from "react";
import EditorPanel from "../_components/editorPanel";
import OutputPanel from "../_components/outputPanel";
import Header from "../_components/header";

export default function Code() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        {/* Header */}
        <Header />

        {/* Code Editor and Output Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EditorPanel />
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}

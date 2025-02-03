import React from "react";
import EditorPanel from "../_components/EditorPanel";
import OutputPanel from "../_components/OutputPanel";
import Header from "../_components/Header";

export default async function Code({ searchParams }: CodeProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto p-4">
        <Header searchParams={resolvedSearchParams} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EditorPanel />
          <OutputPanel />
        </div>
      </div>
    </div>
  );
}

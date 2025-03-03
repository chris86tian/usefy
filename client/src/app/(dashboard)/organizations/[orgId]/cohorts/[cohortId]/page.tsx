'use client'

import React from "react";
import { useParams } from "next/navigation";

const CohortPage = () => {
    const { orgId, cohortId } = useParams();
    return <div>Cohort: {orgId} - {cohortId}</div>;
};

export default CohortPage;
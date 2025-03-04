import AccordionSections from "@/components/AccordionSections";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import React from "react";

const SelectedCourse = ({ course, handleEnrollNow, userId }: SelectedCourseProps) => {
  return (
    <div className="selected-course">
      <div>
        <h3 className="selected-course__title">{course.title}</h3>
        <p className="selected-course__author">
          {/* By {course.instructors[0].userId} |{" "} */}
          <span className="selected-course__enrollment-count">
            {course?.enrollments?.length} enrolled
          </span>
        </p>
      </div>

      <div className="selected-course__content">
        <p className="selected-course__description">{course.description}</p>

        <div className="selected-course__sections">
          <h4 className="selected-course__sections-title">Course Content</h4>
          <AccordionSections sections={course.sections} />
        </div>

        <div className="selected-course__footer">
          <span className="selected-course__price">
            {formatPrice(course.price)}
          </span>
          {course.enrollments?.some(
            (enrollment) => enrollment.userId === userId
          ) ? (
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled
              onClick={() => {}}
            >
              Enrolled
            </Button>
          ) : (
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => handleEnrollNow(course.courseId)}
            >
              Enroll Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedCourse;
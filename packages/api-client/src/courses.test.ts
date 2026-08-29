import { describe, expect, it } from "vitest";
import { getCourseWithLessons } from "./courses";
import { mockClientFromTables, ok } from "./test-utils";

describe("getCourseWithLessons", () => {
  it("returns null when the course doesn't exist (or isn't visible under RLS)", async () => {
    const client = mockClientFromTables({ course: ok(null) });
    await expect(getCourseWithLessons(client, "course-missing")).resolves.toBeNull();
  });

  it("attaches the caller's own progress to each lesson, and null where there is none", async () => {
    const course = { id: "course-1", title: "New Believers", course_type: "program" };
    const lesson1 = { id: "lesson-1", course_id: "course-1", position: 1, title: "Intro" };
    const lesson2 = { id: "lesson-2", course_id: "course-1", position: 2, title: "Next steps" };
    const progress1 = { id: "p1", lesson_id: "lesson-1", completed_at: "2026-08-01", quiz_score: 90 };
    const client = mockClientFromTables({
      course: ok(course),
      lesson: ok([lesson1, lesson2]),
      person_progress: ok([progress1]),
    });

    await expect(getCourseWithLessons(client, "course-1")).resolves.toEqual({
      course,
      lessons: [
        { ...lesson1, progress: progress1 },
        { ...lesson2, progress: null },
      ],
    });
  });
});

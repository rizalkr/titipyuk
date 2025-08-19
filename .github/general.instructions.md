---
applyTo: "**/*.ts,**/*.tsx"
---
# Project "TitipYuk Semarang" Coding Style & Guidelines

Apply the [general coding principles](./general-coding.instructions.md) to all code. The rules below are the specific conventions for this project.

## TypeScript Rules
- Use TypeScript for all new code, leveraging modern ESNext features.
- [CRITICAL] All complex `interface` and `type` definitions MUST be in a separate file (`types.ts`). NEVER write them inline within a component file (`.tsx`).
- Use `interface` to define the shape of objects (props, state, API responses). Prefix them with `I` (e.g., `IBooking`).
- Use `type` for utility types, unions, or intersections. Prefix them with `T` (e.g., `TBookingStatus`).
- Prefer immutable data structures (`const`, `readonly`).
- Leverage optional chaining (`?.`) and nullish coalescing (`??`) for handling potentially null/undefined values.

## React & Next.js Rules
- Always use functional components with arrow functions and the `FC` type from React.
- Strictly follow the Rules of Hooks (do not call Hooks inside conditions, loops, or regular functions).
- Destructure props and always provide explicit types from the corresponding `types.ts` file.
- Keep components small and focused on a single responsibility (SRP).
- Complex components must reside in their own folder, along with their corresponding `types.ts` file.
- Use `export default` for the main component in each file.

## Styling Rules (Tailwind CSS)
- Use the `cn` utility (from shadcn/ui) for conditional and dynamic class merging.
- Automatically sort Tailwind CSS classes using the official Prettier plugin to maintain consistency.

## Architecture & Services Rules
- [CRITICAL] Abstract all database interaction logic into separate service files (e.g., `src/services/bookingService.ts`).
- React components MUST NOT call the Supabase client directly. They must call functions from the service layer.
- Initialize the Supabase client as a singleton in `src/lib/supabaseClient.ts` to be used across the application.
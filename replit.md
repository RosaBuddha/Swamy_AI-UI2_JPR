# Chat Application

## Overview
This project is a modern chat application designed for the chemical industry. It features real-time AI responses, chat session management, and a user-friendly interface. The application leverages a three-tier fallback system for AI responses: configurable mock responses, a Retrieval-Augmented Generation (RAG) system integrated with a product catalog (Knowde API), and a general OpenAI model. It aims to provide accurate, industry-specific information and enhance user interaction through advanced features like disambiguation and rich content display.

## Recent Changes (January 31, 2025)
- **MAJOR: Fixed RAG Content Processing Issue** - Resolved critical discrepancy where chat responses showed "Unknown Company" while admin RAG Test showed correct "Group Principal: Evonik Corporation" information
- **Enhanced Principal Extraction**: Updated `processRagContent` method to use intelligent content parsing when metadata extraction fails, leveraging the existing `extractPrincipal` method
- **Improved Content Prioritization**: Implemented smart sorting to prioritize RAG results containing Group Principal information and specific company data
- **Cache Invalidation System**: Successfully implemented immediate system prompt updates - admin changes now take effect on the next chat request instead of waiting 5 minutes
- **Increased RAG Content Richness**: Content length increased from 320 to 4500+ characters when comprehensive data is available, providing much richer context to OpenAI
- **MAJOR: Implemented Hierarchical Knowledge Framework** - Updated system prompt to enable AI to use general knowledge for competitive analysis and broader context while maintaining RAG data as primary authority for specific product information

## User Preferences
- Prefers simple, everyday language in communications
- Values clean, modern UI with proper TypeScript implementation
- Focuses on chemical industry use cases for AI responses

## System Architecture
The application is built with a clear separation of concerns:
-   **Frontend**: Developed using React 18, TypeScript, and Vite for a fast and type-safe user interface. Styling is handled with Tailwind CSS, complemented by custom Radix UI primitives for accessible and customizable components. Wouter manages client-side routing, and React hooks (specifically `useChat`) manage application state.
-   **Backend**: An Express.js server written in TypeScript handles API requests, orchestrating data flow and AI interactions.
-   **Database**: PostgreSQL is used for data persistence, with Drizzle ORM providing a type-safe and efficient way to interact with the database.
-   **Data Storage**: All application settings, including mock responses and system prompts, are stored persistently in the PostgreSQL database.
-   **UI/UX Decisions**: The design prioritizes a clean, modern aesthetic. Components follow `shadcn/ui` patterns, ensuring accessibility. Rich text editing capabilities are integrated for administrative content, supporting HTML rendering in chat messages. The system includes a comprehensive 4-phase disambiguation system for handling multiple product matches, providing a refined user experience.
-   **Technical Implementations**:
    -   **AI Response System**: Features a sophisticated three-tier fallback logic:
        1.  **Mock Responses**: Configurable question-answer pairs stored in the database.
        2.  **RAG (Retrieval-Augmented Generation)**: Integrates with external product catalog data (Knowde API) to provide contextually relevant answers. Includes intelligent caching, semantic similarity scoring, and content deduplication.
        3.  **OpenAI Integration**: Uses the GPT-4o model as a general fallback, configured with a chemistry-focused system prompt that prioritizes RAG content.
    -   **Streaming Responses**: Server-Sent Events (SSE) are used for OpenAI responses to provide a real-time, low-latency user experience.
    -   **Rich Text Editor**: Utilizes a `contentEditable` approach for rich text editing in the admin panel, supporting bold, italic, lists, and visual table editing.
    -   **Disambiguation System**: A multi-phase system detects ambiguous queries, parses potential product options, provides a user-facing interface for selection, and captures analytics for continuous improvement.
    -   **API Logging**: An in-memory logging system tracks all OpenAI requests, including system prompts, RAG context, and performance metrics, accessible via an admin interface.

## External Dependencies
-   **OpenAI API**: Used for general AI responses and as a fallback in the three-tier system.
-   **PostgreSQL**: Relational database for persistent storage.
-   **Knowde API**: Integrated for Retrieval-Augmented Generation (RAG) to provide product catalog data.
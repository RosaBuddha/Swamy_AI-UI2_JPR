# Chat Application

## Overview
This project is an advanced AI-powered content management web application designed for the chemical industry, featuring sophisticated product replacement capabilities with multi-source data integration and advanced algorithms. The application includes real-time AI chat responses, comprehensive admin interface, and a specialized product replacement system that leverages external APIs (ChemSpider, PubChem) and Phase 3 advanced algorithms for intelligent chemical product discovery and replacement recommendations. The system provides multi-criteria scoring, risk assessment, and detailed algorithm analysis for chemical product replacements.

## Recent Changes (August 1, 2025)
- **MAJOR: Phase 3 Advanced Algorithms Implementation Complete** - Successfully implemented sophisticated replacement algorithms with multi-criteria scoring including chemical similarity, functional compatibility, performance matching, availability, cost effectiveness, and sustainability factors
- **Advanced Scoring Engine**: Created comprehensive ReplacementAlgorithmEngine with specialized engines for chemical similarity, functional compatibility, and performance matching
- **Multi-Criteria Analysis**: Algorithm evaluates replacements across 6 scoring dimensions with weighted overall scores and detailed confidence calculations
- **Intelligent Match Classification**: System now categorizes matches as 'exact', 'similar', 'functional', or 'alternative' with corresponding risk levels and implementation complexity
- **Enhanced External Data Integration**: Phase 3 builds on Phase 2's external API integration with advanced deduplication, ranking, and confidence scoring
- **Algorithm Results Storage**: Replacement results now include comprehensive algorithm metadata with score breakdowns and reasoning explanations
- **Test Validation Complete**: Phase 3 algorithms successfully tested, producing 68% average algorithm scores with detailed multi-criteria breakdowns

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
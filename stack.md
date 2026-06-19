# 1. Inima Aplicației (AI și Generare Imagini)

**Google Vertex AI (Imagen 3)**: Aceasta este piesa esențială care lipsea. Google vă va oferi tokeni pentru Cloud, iar modelul lor Imagen 3 generează poze fotorealiste sau stilizate uimitoare. Juriul va aprecia maxim utilizarea modelului lor de top pentru imagini.

**Google Gemini API**: Poate fi folosit în fundal pentru a transforma un an simplu ales de voi într-un prompt descriptiv și bogat (ex: "O stradă din Londra în anul 1890, trăsuri, ceață, felinare pe gaz") pe care să îl trimiteți apoi către Imagen.

# 2. Frontend și UI (Viteza de Vibe Coding)

**Next.js (React) + Tailwind CSS**: Combinația supremă, ușor de generat și modificat cu asistenții AI.

**21st.dev**: O alegere sclipitoare. Iei componente Tailwind spectaculoase direct de acolo, le pui în cod și ai un design premium instantaneu, fără să pierzi timp pe CSS manual.

**Dribbble**: Îl folosești fix cum ai spus, ca referință vizuală. Faci screenshot la un layout care îți place și îl oferi ca imagine de referință agentului din Antigravity 2.0 pentru a-l replica.

**Firebase Hosting**: Ai menționat Vercel (care este excelent), dar dacă sunteți la un hackathon Google, este o strategie mai bună să faceți deploy la aplicația Next.js direct pe Firebase Hosting. Platforma suportă nativ Next.js acum și punctează excelent la impresia tehnică.

# 3. Backend și Baze de Date (Infrastructura)

**Firebase Cloud Functions (Python)**: Funcțiile serverless scrise în Python sunt perfecte pentru a gestiona logica de backend, validarea răspunsurilor și apelurile sigure către API-urile Google, ascunzând cheile de acces față de frontend.

**Firestore**: Baza de date NoSQL ideală pentru un Leaderboard în timp real. Toți participanții din sală care scanează codul QR își vor vedea scorurile actualizate live pe ecranul vostru.

**Firebase Storage**: Când Imagen 3 generează o poză pentru o anumită epocă, funcția de backend o va salva automat în Firebase Storage. Dacă alt jucător primește aceeași epocă, încărcați imaginea din Storage. Astfel, aplicația se mișcă mult mai rapid și economisiți tokeni.

**Firebase MCP**: Pentru a lega Antigravity 2.0 direct de resursele de mai sus și a face configurarea bazei de date complet automatizată.

# 4. Factorul "FUN" (Audio)

**ElevenLabs**: Ideea ta de a integra ElevenLabs este genială pentru tema hackathonului. Deși nu este un produs Google, îl puteți folosi pentru a genera o voce de narator epic (un ton de trailer de film) care să anunțe epocile sau să comenteze ironic când jucătorul ratează anul complet.

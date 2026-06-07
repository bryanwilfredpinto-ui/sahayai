"""Manifest of OFFICIAL, FREE source documents for the Chitti Legal RAG corpus.

These are the authoritative, freely-published Government of India legal texts (India
Code / Legislative Department). `ingest.py --download` fetches each into rag/corpus/
then chunks + embeds it. Some .gov.in sites block non-browser user-agents; ingest
retries with a browser UA + the listed mirrors and logs honestly when a source can't
be fetched (it NEVER fabricates content).

Update a URL here when the department republishes a consolidated PDF. The `doc` /
`source` strings become the citation shown to the user.

NOTE on the 2023 codes: IPC/CrPC/Evidence Act remain the source of record for offences
committed and cases filed before 1-Jul-2024 and for ongoing matters; the new
BNS/BNSS/BSA 2023 govern offences on/after 1-Jul-2024. Both are listed so Chitti can
cite the correct code for the user's situation (the new codes are added as mirrors /
extra ids and can be dropped into corpus/ manually).
"""

OFFICIAL_SOURCES = [
    {
        "id": "constitution_of_india",
        "doc": "The Constitution of India",
        "source": "Legislative Department, Ministry of Law & Justice, Government of India",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/19150/1/constitution_of_india.pdf",
        "mirrors": [
            "https://cdnbbsr.s3waas.gov.in/s380537a945c7aaa788ccfcdf1b99b5d8f/uploads/2024/07/20240716890312078.pdf",
            "https://lddashboard.legislative.gov.in/sites/default/files/COI...pdf",
        ],
    },
    {
        "id": "indian_penal_code_1860",
        "doc": "The Indian Penal Code, 1860 (Act 45 of 1860)",
        "source": "India Code, Legislative Department, Government of India",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2263/1/aA1860-45.pdf",
        "mirrors": [
            "https://www.indiacode.nic.in/bitstream/123456789/15289/1/ipc_act.pdf",
            "https://www.indiacode.nic.in/bitstream/123456789/4219/1/THE-INDIAN-PENAL-CODE-1860.pdf",
        ],
    },
    {
        "id": "crpc_1973",
        "doc": "The Code of Criminal Procedure, 1973 (Act 2 of 1974)",
        "source": "India Code, Legislative Department, Government of India",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/15272/1/the_code_of_criminal_procedure,_1973.pdf",
        "mirrors": [
            "https://www.indiacode.nic.in/bitstream/123456789/4221/1/Criminal-Procedure-Code-CrPC-1973.pdf",
        ],
    },
    {
        "id": "indian_evidence_act_1872",
        "doc": "The Indian Evidence Act, 1872 (Act 1 of 1872)",
        "source": "India Code, Legislative Department, Government of India",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/15351/1/iea_1872.pdf",
        "mirrors": [
            "https://www.indiacode.nic.in/bitstream/123456789/4218/1/THE-INDIAN-EVIDENCE-ACT-1872.pdf",
            "https://www.indiacode.nic.in/bitstream/123456789/6819/1/indian_evidence_act_1872.pdf",
        ],
    },
    {
        "id": "indian_contract_act_1872",
        "doc": "The Indian Contract Act, 1872 (Act 9 of 1872)",
        "source": "India Code, Legislative Department, Government of India",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2187/2/A187209.pdf",
        "mirrors": [
            "https://www.indiacode.nic.in/bitstream/123456789/2187/1/A1872-9.pdf",
        ],
    },
]

# A realistic browser UA — some .gov.in sites 403 the default urllib UA.
BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

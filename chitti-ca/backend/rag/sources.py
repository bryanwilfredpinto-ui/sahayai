"""Manifest of OFFICIAL, FREE source documents for the Chitti CA RAG corpus.

These are the authoritative, freely-published government / ICAI documents. `ingest.py
--download` fetches each into rag/corpus/ then chunks + embeds it. Some government
sites (incometaxindia.gov.in) block non-browser user-agents; ingest retries with a
browser UA and the listed mirrors, and logs honestly when a source can't be fetched
(it never fabricates content).

Update a URL here when the department republishes (e.g. a new consolidated PDF). The
`doc`/`source` strings become the citation shown to the user.
"""

OFFICIAL_SOURCES = [
    {
        "id": "income_tax_act_2025",
        "doc": "Income-tax Act, 2025",
        "source": "Income Tax Department, Government of India",
        # The new Income-tax Act, 2025 (received assent 2025) — official PDF.
        "url": "https://incometaxindia.gov.in/Lists/Bills/Attachments/income-tax-bill-2025.pdf",
        "mirrors": [
            "https://www.indiacode.nic.in/bitstream/123456789/income-tax-act-2025.pdf",
        ],
    },
    {
        "id": "income_tax_act_1961",
        "doc": "Income-tax Act, 1961 (consolidated)",
        "source": "Income Tax Department, Government of India",
        "url": "https://incometaxindia.gov.in/pages/acts/income-tax-act.aspx",
        "mirrors": [],
    },
    {
        "id": "cgst_act_2017",
        "doc": "Central Goods and Services Tax (CGST) Act, 2017",
        "source": "CBIC, Department of Revenue, Ministry of Finance",
        "url": "https://cbic-gst.gov.in/pdf/CGST-Act-Updated-30062022.pdf",
        "mirrors": [
            "https://cbic-gst.gov.in/CGST-bill-e.html",
        ],
    },
    {
        "id": "igst_act_2017",
        "doc": "Integrated Goods and Services Tax (IGST) Act, 2017",
        "source": "CBIC, Department of Revenue, Ministry of Finance",
        "url": "https://cbic-gst.gov.in/pdf/IGST-Act-Updated-30062022.pdf",
        "mirrors": [],
    },
    {
        "id": "icai_bos_taxation",
        "doc": "ICAI Board of Studies — Taxation Study Material",
        "source": "The Institute of Chartered Accountants of India (ICAI)",
        "url": "https://www.icai.org/post/bos-knowledge-portal",
        "mirrors": [],
    },
]

# A realistic browser UA — some .gov.in sites 403 the default urllib UA.
BROWSER_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

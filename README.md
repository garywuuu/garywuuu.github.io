# Personal Website

A minimalist black and white personal website with a Three.js voxel lobby at `/play/`, hosted on GitHub Pages.

## Features

- **Routed pages**: Play, About, Research, Experience
- **Instaplay Spawn**: first-person voxel plaza. Walk into a labeled booth to play a live Instaplay game. Side buildings open About, Research, and Experience.
- **Research Papers**: Display and download PDF research papers from college
- **Experience**: Resume-style display of internships and work experiences
- **Responsive design**: Works on desktop and mobile devices
- **Accessible**: Keyboard navigation and proper semantic HTML

## Play

Open `/play/`. A pixel greeting fades after a few seconds. Click the world to look around.

- WASD walk, mouse look, space jump
- Greeting: "hey / i'm gary, welcome to my site! click to play."
- Plaza extras: roaming animals that stay on solid ground; Favorites bookshelf left of Experience
- Five booths, centered: Neon Reflex, Third Rally, Make a Game, Voxel Safari, Blockfront
- The middle stall is a 3-wide nether portal. Walk in to open Instaplay create.
- Games load from `instaplay.ai/embed/g/{shortId}`. Make a Game goes to `instaplay.ai/create`.
- Tower sign is YC S26 beside the white Instaplay wordmark and red icon
- HUD map or keys 1–5 warp to a booth
- About / Research / Experience buildings are labeled. Walk in to open that page; use **Play** in the navigation to return.
- Esc or **Leave cabinet** returns to the voxel world

Local preview: `python3 -m http.server 4173` from this folder, then visit `http://localhost:4173`.

## Setup

1. Clone this repository
2. Customize the content in `index.html` (About and Contact sections)
3. Add your research papers:
   - Place PDF files in `assets/papers/`
   - Update `data/papers.json` with paper metadata
4. Add your experience:
   - Update `data/experience.json` with your work history
   - Update `data/links.json` with link preview metadata (optional images in `assets/images/`)
5. Keep `CNAME`, page metadata, `robots.txt`, and `sitemap.xml` aligned with `https://wugary.com`

## File Structure

```
personal-website/
├── index.html          # Main HTML file
├── styles.css          # Black/white theme styles
├── script.js           # JavaScript for rendering dynamic content
├── data/
│   ├── papers.json    # Research paper metadata
│   ├── experience.json # Work experience entries
│   └── links.json     # Link preview metadata
├── assets/
│   ├── papers/        # PDF research papers
│   └── images/        # Link preview images and favicon
├── robots.txt         # SEO robots file
└── sitemap.xml        # SEO sitemap
```

## Deployment

The site is hosted by GitHub Pages from the `main` branch and repository root of `garywuuu/garywuuu.github.io`. The custom domain is `wugary.com`; `CNAME` preserves it across deployments.

In Namecheap, open **Domain List → wugary.com → Manage → Advanced DNS**. With Namecheap BasicDNS, configure these host records with Automatic TTL:

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `garywuuu.github.io` |

Replace Namecheap's parking or URL redirect records for `@` and `www` with these records. Preserve unrelated records, including email and verification records. These addresses are documented in [GitHub's custom-domain setup guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

For the initial domain switch, have Namecheap ready before publishing the change. Push the domain configuration to `main`, then save the DNS records above. In **GitHub → Settings → Pages**, confirm the custom domain is `wugary.com`. Once DNS passes and GitHub provisions its certificate, enable **Enforce HTTPS**. DNS changes can take up to 24 hours to propagate.

The primary URL is `https://wugary.com/`. GitHub Pages redirects `www.wugary.com` to the primary domain after DNS and HTTPS are ready. The previous domain needs separate redirect hosting if it should continue forwarding visitors to the new address.

## Customization

### Adding a Research Paper

1. Add the PDF file to `assets/papers/`
2. Add an entry to `data/papers.json`:
```json
{
    "title": "Your Paper Title",
    "venue": "Course/Conference Name",
    "year": 2024,
    "summary": "Brief summary",
    "abstract": "Longer abstract (optional)",
    "pdf": "assets/papers/your-paper.pdf"
}
```

### Adding Work Experience

1. Add an entry to `data/experience.json`:
```json
{
    "title": "Job Title",
    "company": "Company Name",
    "location": "City, State",
    "startDate": "2024-06",
    "endDate": "2024-08",
    "description": ["Bullet point 1", "Bullet point 2"],
    "technologies": ["Tech1", "Tech2"],
    "links": ["link-id-1"]
}
```

2. If you want link previews, add the link metadata to `data/links.json`:
```json
{
    "link-id-1": {
        "url": "https://example.com/project",
        "title": "Project Name",
        "description": "Project description",
        "image": "assets/images/project-preview.jpg"
    }
}
```

## Tests

Unit tests for `script.js` run with [Vitest](https://vitest.dev/) in a jsdom environment.

```bash
npm install
npm test          # run the suite
npm run coverage  # run the suite with a coverage report
```

The site itself stays dependency-free: `node_modules` is only needed to run the tests.

## License

MIT License - feel free to use this template for your own personal website.

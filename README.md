# Personal Website

A minimalist black and white personal website with a Three.js voxel lobby on the homepage, hosted on GitHub Pages.

## Features

- **Routed pages**: Play, About, Research, Experience
- **Instaplay Spawn**: first-person voxel plaza. Walk into a labeled booth to play a live Instaplay game. Side buildings open About, Research, and Experience.
- **Research Papers**: Display and download PDF research papers from college
- **Experience**: Resume-style display of internships and work experiences
- **Responsive design**: Works on desktop and mobile devices
- **Accessible**: Keyboard navigation and proper semantic HTML

## Play

Open `/`. A pixel greeting fades after a few seconds. Click the world to look around.

- WASD walk, mouse look, space jump
- Greeting: "hey / i'm gary, welcome to my site! click in and wander."
- Plaza extras: roaming animals that stay on solid ground; Favorites bookshelf left of Experience
- Five booths, centered: Neon Reflex, Third Rally, Make a Game, Voxel Safari, Blockfront
- The middle stall is a 3-wide nether portal. Walk in to open Instaplay create.
- Games load from `instaplay.ai/embed/g/{shortId}`. Make a Game goes to `instaplay.ai/create`.
- Tower sign is YC S26 beside the white Instaplay wordmark and red icon
- HUD map or keys 1–5 warp to a booth
- About / Research / Experience buildings are labeled. Walk in to open that page; use **Back to game** to return.
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
5. Update `robots.txt` and `sitemap.xml` with your GitHub Pages URL

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

1. Push your code to a GitHub repository
2. Go to Settings > Pages
3. Select the branch (usually `main`) and root directory
4. Your site will be available at `https://yourusername.github.io/personal-website/`

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


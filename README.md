# Personal Website

A minimalist black and white personal website built with plain HTML, CSS, and JavaScript, designed to be hosted on GitHub Pages.

## Features

- **Single-page design** with sections for About, Research Papers, Experience, and Contact
- **Research Papers**: Display and download PDF research papers from college
- **Experience**: Resume-style display of internships and work experiences with rich link previews
- **Responsive design**: Works on desktop and mobile devices
- **Accessible**: Keyboard navigation and proper semantic HTML

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

## License

MIT License - feel free to use this template for your own personal website.


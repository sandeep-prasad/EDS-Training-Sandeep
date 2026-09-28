export default function decorate(block) {
  if (!block.querySelector(':scope > div:first-child picture')) {
    block.classList.add('no-image');
  }

  // group the text (heading, paragraph, CTA) into a content box for overlay positioning
  const contentCell = [...block.querySelectorAll(':scope > div > div')]
    .find((cell) => !cell.querySelector('picture'));
  if (contentCell) {
    contentCell.classList.add('hero-banner-content');

    // decorate a standalone <p><a> as the yellow CTA button (matches source teaser action)
    const cta = [...contentCell.querySelectorAll('p > a')]
      .find((a) => a.parentElement.textContent.trim() === a.textContent.trim());
    if (cta) {
      cta.classList.add('button');
      cta.parentElement.classList.add('button-container');
    }
  }
}

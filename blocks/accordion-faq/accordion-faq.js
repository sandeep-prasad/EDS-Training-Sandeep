/*
 * accordion-faq — expandable question/answer list. Base: accordion.
 *
 * Content model (EDS table): one row per Q&A.
 *   cell 1 = question (rendered as the summary/toggle)
 *   cell 2 = answer content (rich text, revealed when expanded)
 *
 * Rendered with native <details>/<summary> for accessible, keyboard-friendly
 * expand/collapse. Rows missing a question are skipped; a missing answer yields
 * an empty panel.
 */
export default function decorate(block) {
  const rows = [...block.children];

  block.textContent = '';

  rows.forEach((row) => {
    const cells = [...row.children];
    const questionCell = cells[0];
    const answerCell = cells[1];

    const question = questionCell ? questionCell.textContent.trim() : '';
    if (!question) return;

    const item = document.createElement('details');
    item.className = 'accordion-faq-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-question';
    summary.textContent = question;

    const answer = document.createElement('div');
    answer.className = 'accordion-faq-answer';
    if (answerCell) {
      while (answerCell.firstChild) answer.append(answerCell.firstChild);
    }

    item.append(summary, answer);
    block.append(item);
  });
}

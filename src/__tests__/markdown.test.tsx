import { render, screen } from '@testing-library/react';
import { Markdown } from '@/components/markdown';

describe('Markdown', () => {
  it('renders bold text', () => {
    render(<Markdown content="This is **bold** text" />);
    const bold = screen.getByText('bold');
    expect(bold.tagName).toBe('STRONG');
  });

  it('renders italic text', () => {
    render(<Markdown content="This is *italic* text" />);
    const italic = screen.getByText('italic');
    expect(italic.tagName).toBe('EM');
  });

  it('renders links', () => {
    render(<Markdown content="Visit [Google](https://google.com)" />);
    const link = screen.getByText('Google');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://google.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders blockquotes', () => {
    render(<Markdown content="> This is a quote" />);
    expect(screen.getByText('This is a quote')).toBeInTheDocument();
  });

  it('renders headings', () => {
    render(<Markdown content="## Section Title" />);
    const heading = screen.getByText('Section Title');
    expect(heading.tagName).toBe('H3');
  });

  it('renders horizontal rules', () => {
    const { container } = render(<Markdown content="---" />);
    expect(container.querySelector('hr')).toBeInTheDocument();
  });

  it('renders plain text without markers', () => {
    render(<Markdown content="Just plain text here" />);
    expect(screen.getByText('Just plain text here')).toBeInTheDocument();
  });

  it('renders empty content gracefully', () => {
    const { container } = render(<Markdown content="" />);
    expect(container).toBeInTheDocument();
  });
});

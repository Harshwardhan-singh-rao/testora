import { render, screen } from '@testing-library/react'
import { Navbar } from './Navbar'

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
}));

describe('Navbar Component', () => {
  it('renders the navbar text', () => {
    // Assuming Navbar has some recognizable text or role.
    render(<Navbar />)
    const element = screen.getByText(/Testora Admin/i)
    expect(element).toBeInTheDocument()
  })
})

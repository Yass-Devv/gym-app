import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders home page with title and login button', () => {
  render(<App />);
  expect(screen.getByText(/Yass-GYM/i)).toBeInTheDocument();
  expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
});

it('allows user to login and changes greeting', () => {
  render(<App />);
  // open login form
  fireEvent.click(screen.getByText(/Se connecter/i));

  // fill form
  fireEvent.change(screen.getByPlaceholderText(/Nom/i), { target: { value: 'Pierre' } });
  fireEvent.change(screen.getByPlaceholderText(/Mot de passe/i), { target: { value: 'secret' } });

  // submit
  fireEvent.click(screen.getByText(/^Se connecter$/i));

  expect(screen.getByText(/Salut Pierre/i)).toBeInTheDocument();
});

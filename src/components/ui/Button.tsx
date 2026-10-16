import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonClass';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});

export function ButtonLink({ variant = 'primary', size = 'md', className, ...props }: LinkProps & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

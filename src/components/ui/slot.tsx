import { Children, cloneElement, isValidElement } from "react";
import type { ReactElement, ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal Radix-style Slot: merges its props onto its single child element,
 * so `<Button asChild><Link/></Button>` renders one `<a>` with button styles.
 */
export function Slot({
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children?: ReactNode }) {
  if (!isValidElement(children)) return null;
  const child = Children.only(children) as ReactElement<
    Record<string, unknown>
  >;
  const childProps = child.props;
  return cloneElement(child, {
    ...props,
    ...childProps,
    className: cn(
      props.className as string,
      childProps.className as string,
    ),
  });
}

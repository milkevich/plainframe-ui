/** @jsxImportSource @emotion/react */
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  Children,
  isValidElement,
  createContext,
  useContext,
} from "react";
import { css, keyframes, type Interpolation, type Theme } from "@emotion/react";

type Variant = "toggle" | "flash";
type Effect = "rotate" | "scale" | "scale-rotate";

type Phase = "idle" | "first" | "second";

interface SwapContextValue {
  activeValue: string;
  variant: Variant;
  animationEffect: Effect;
  flashDuration: number;
  isAnimating: boolean;
  handleSwap: () => void;
  disabled: boolean;
  transitionFrom: string | null;
  transitionTo: string | null;
  transitionPhase: Phase;
}

const SwapContext = createContext<SwapContextValue | null>(null);

const useSwapContext = () => {
  const ctx = useContext(SwapContext);
  if (!ctx) {
    throw new Error("SwapItem must be used within Swap");
  }
  return ctx;
};

export interface SwapProps {
  variant?: Variant;
  animationEffect?: Effect;
  flashDuration?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  css?: Interpolation<Theme>;
}

export interface SwapItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  css?: Interpolation<Theme>;
}

const ANIMATION_MS = 220;

const scaleAnim = keyframes`
  0%   { transform: scale(1); }
  45%  { transform: scale(0.85); }
  55%  { transform: scale(0.85); }
  100% { transform: scale(1); }
`;

const rotateAnim = keyframes`
  0%   { transform: rotate(0deg); }
  49%  { transform: rotate(179deg); }
  51%  { transform: rotate(181deg); }
  100% { transform: rotate(360deg); }
`;

const scaleRotateAnim = keyframes`
  0%   { transform: scale(1)    rotate(0deg); }
  40%  { transform: scale(0.9)  rotate(140deg); }
  50%  { transform: scale(0.85) rotate(180deg); }
  60%  { transform: scale(0.9)  rotate(220deg); }
  100% { transform: scale(1)    rotate(360deg); }
`;

export const SwapItem = React.forwardRef<HTMLDivElement, SwapItemProps>(
  ({ value, children, className = "", css: customCss }, ref) => {
    const {
      activeValue,
      animationEffect,
      isAnimating,
      transitionFrom,
      transitionTo,
      transitionPhase,
    } = useSwapContext();

    const isOverlayEffect =
      animationEffect === "rotate" ||
      animationEffect === "scale-rotate" ||
      animationEffect === "scale";

    let shouldShow = false;
    let opacity = 0;

    if (!isAnimating || !isOverlayEffect) {
      shouldShow = value === activeValue;
      opacity = shouldShow ? 1 : 0;
    } else {
      const isFrom = value === transitionFrom;
      const isTo = value === transitionTo;

      if (isFrom || isTo) {
        shouldShow = true;
        if (transitionPhase === "first") {
          opacity = isFrom ? 1 : 0;
        } else {
          opacity = isTo ? 1 : 0;
        }
      } else {
        shouldShow = false;
        opacity = 0;
      }
    }

    const itemCss = css({
      gridArea: "1 / 1 / 2 / 2",
      transition: `opacity ${ANIMATION_MS / 2}ms ease-out`,
      opacity,
      display: shouldShow ? "block" : "none",
    });

    return (
      <div
        ref={ref}
        className={`pfui-swap-item ${className}`}
        css={[itemCss, customCss]}
        aria-hidden={opacity === 0}
      >
        {children}
      </div>
    );
  }
);

SwapItem.displayName = "SwapItem";

export const Swap = React.forwardRef<HTMLDivElement, SwapProps>(
  (
    {
      variant = "toggle",
      animationEffect = "scale",
      flashDuration = 750,
      value: controlledValue,
      defaultValue,
      onChange,
      disabled = false,
      children,
      className = "",
      css: customCss,
    },
    ref
  ) => {
    const childArray = Children.toArray(children).filter(isValidElement);
    const values = childArray
      .filter((child): child is React.ReactElement<SwapItemProps> => 
        isValidElement(child) && child.type === SwapItem
      )
      .map((child) => child.props.value as string);

    const initial = defaultValue ?? values[0] ?? "";

    const [internalValue, setInternalValue] = useState(initial);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const [transitionFrom, setTransitionFrom] = useState<string | null>(null);
    const [transitionTo, setTransitionTo] = useState<string | null>(null);
    const [transitionPhase, setTransitionPhase] = useState<Phase>("idle");

    const isControlled = controlledValue !== undefined;
    const activeValue = isControlled ? (controlledValue as string) : internalValue;

    const flashMs = flashDuration ?? 200;

    const timeoutsRef = useRef<number[]>([]);

    const clearAllTimeouts = () => {
      timeoutsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutsRef.current = [];
    };

    useEffect(() => {
      return () => {
        clearAllTimeouts();
      };
    }, []);

    const commitValue = (next: string) => {
      if (isControlled) {
        onChange?.(next);
      } else {
        setInternalValue(next);
      }
    };

    const runSwap = useCallback(
      (from: string, to: string, after?: () => void) => {
        clearAllTimeouts();
        setIsAnimating(true);
        setTransitionFrom(from);
        setTransitionTo(to);
        setTransitionPhase("first");

        const mid = window.setTimeout(() => {
          commitValue(to);
          setTransitionPhase("second");
        }, ANIMATION_MS / 2);

        const end = window.setTimeout(() => {
          setIsAnimating(false);
          setTransitionFrom(null);
          setTransitionTo(null);
          setTransitionPhase("idle");
          after?.();
        }, ANIMATION_MS);

        timeoutsRef.current.push(mid, end);
      },
      [isControlled, onChange]
    );

    const handleSwap = useCallback(() => {
      if (disabled || isAnimating || isFlashing || values.length <= 1) return;

      const base = initial;
      const baseIndex = values.indexOf(base);
      const nextIndexFromBase =
        baseIndex === -1 ? 0 : (baseIndex + 1) % values.length;
      const nextFromBase = values[nextIndexFromBase];

      if (variant === "toggle") {
        const currentIndex = values.indexOf(activeValue);
        const nextIndex = (currentIndex + 1) % values.length;
        const nextValue = values[nextIndex];
        runSwap(activeValue, nextValue);
      } else {
        setIsFlashing(true);

        const flashValue =
          nextFromBase === base
            ? values[(nextIndexFromBase + 1) % values.length]
            : nextFromBase;

        runSwap(base, flashValue, () => {
          const pause = window.setTimeout(() => {
            runSwap(flashValue, base, () => {
              setIsFlashing(false);
            });
          }, flashMs);
          timeoutsRef.current.push(pause);
        });
      }
    }, [
      disabled,
      isAnimating,
      isFlashing,
      values,
      activeValue,
      variant,
      flashMs,
      runSwap,
      initial,
    ]);

    const animationKeyframes =
      animationEffect === "rotate"
        ? rotateAnim
        : animationEffect === "scale-rotate"
        ? scaleRotateAnim
        : scaleAnim;

    const swapCss = css({
      position: "relative",
      display: "inline-grid",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      transformOrigin: "center",
      backfaceVisibility: "hidden",
      ...(isAnimating && {
        animation: `${animationKeyframes} ${ANIMATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
      }),
    });

    const contextValue: SwapContextValue = {
      activeValue,
      variant,
      animationEffect,
      flashDuration: flashMs,
      isAnimating,
      handleSwap,
      disabled,
      transitionFrom,
      transitionTo,
      transitionPhase,
    };

    return (
      <SwapContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={`pfui-swap ${className}`}
          css={[swapCss, customCss]}
          onClick={handleSwap}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleSwap();
            }
          }}
          aria-disabled={disabled}
        >
          {children}
        </div>
      </SwapContext.Provider>
    );
  }
);

Swap.displayName = "Swap";
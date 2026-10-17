/*
 * Vai trò: Kiểm tra card được reveal khi vào viewport hoặc khi điều hướng bằng bàn phím.
 */
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollRevealController } from "../src/controllers/ui/useScrollRevealController";
import { MemoryRouter } from "react-router-dom";
import { ProjectCard } from "../src/views/components/common/TheDuAn";

let observerCallback: IntersectionObserverCallback | undefined;
const observe = vi.fn();
const unobserve = vi.fn();

class IntersectionObserverMock {
  readonly root = null;
  readonly rootMargin = "0px";
  readonly thresholds = [];
  readonly disconnect = vi.fn();
  readonly observe = observe;
  readonly takeRecords = vi.fn(() => []);
  readonly unobserve = unobserve;

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }
}

function RevealCard() {
  const { elementRef, isRevealed, reveal } =
    useScrollRevealController<HTMLElement>();

  return (
    <article
      ref={elementRef}
      className={isRevealed ? "is-revealed" : ""}
      data-testid="reveal-card"
      onFocus={reveal}
    >
      <button type="button">Open article</button>
    </article>
  );
}

beforeEach(() => {
  observerCallback = undefined;
  observe.mockClear();
  unobserve.mockClear();
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches: false }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useScrollRevealController", () => {
  it("reveals a card once it enters the viewport", () => {
    render(<RevealCard />);

    const card = screen.getByTestId("reveal-card");
    expect(card.classList.contains("is-revealed")).toBe(false);
    expect(observe).toHaveBeenCalledWith(card);

    act(() => {
      observerCallback?.(
        [
          {
            isIntersecting: true,
            target: card,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(card.classList.contains("is-revealed")).toBe(true);
    expect(unobserve).toHaveBeenCalledWith(card);
  });

  it("reveals the card when a keyboard user focuses its content", () => {
    render(<RevealCard />);

    fireEvent.focus(screen.getByRole("button", { name: "Open article" }));

    expect(
      screen.getByTestId("reveal-card").classList.contains("is-revealed"),
    ).toBe(true);
  });

  it("connects project cards to the shared reveal controller", () => {
    render(
      <MemoryRouter>
        <ProjectCard
          image="/project.jpg"
          location="Hồ Chí Minh"
          revealIndex={2}
          slug="du-an-thu-nghiem"
          title="Dự án thử nghiệm"
        />
      </MemoryRouter>,
    );

    const card = document.querySelector(".project-card");
    expect(card?.classList.contains("project-card--reveal")).toBe(true);
    expect(card?.classList.contains("is-revealed")).toBe(false);

    act(() => {
      observerCallback?.(
        [
          {
            isIntersecting: true,
            target: card,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(card?.classList.contains("is-revealed")).toBe(true);
  });
});

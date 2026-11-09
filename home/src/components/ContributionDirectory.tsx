import type { Contribution } from "../data/site";

import { ContributionLink } from "./ContributionLink";

export function ContributionDirectory({
  items,
  client,
  fromResume,
  onActivate,
}: {
  items: Contribution[];
  client?: boolean;
  fromResume?: boolean;
  onActivate?: (id: string) => void;
}) {
  return (
    <ul className="directory">
      {items.map(item => (
        <li key={item.id}>
          <ContributionLink
            client={client}
            fromResume={fromResume}
            item={item}
            onActivate={
              onActivate
                ? () => {
                    onActivate(item.id);
                  }
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}

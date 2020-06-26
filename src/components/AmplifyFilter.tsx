import React, { useEffect } from "react";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Filter } from "react-admin";

interface Keys {
  [index: string]: {
    hashKey: string;
    sortKey: string;
  };
}

// Extracts hash and sort keys from source props
function getKeys(children: React.ReactNodeArray): Keys {
  const keys = {};

  for (const child of children) {
    const input = child as { props: { source: string } };

    const source = input.props.source;
    const sourceSplit = source.split(".");

    // A dot must seperate the query name and the key name
    if (sourceSplit.length < 2) {
      throw new Error(
        `Source ${source} is not valid because a separation dot is missing`
      );
    }

    const queryName = sourceSplit[0];
    const keyName = sourceSplit[1];

    if (!keys[queryName]) {
      keys[queryName] = {
        hashKey: "",
        sortKey: "",
      };
    }

    // Case when there is only the hash key
    if (sourceSplit.length === 2) {
      if (keys[queryName].hashKey !== "") {
        throw new Error(
          `Source ${source} is not valid because hash key is already defined by another input`
        );
      }

      keys[queryName].hashKey = keyName;

      continue;
    }

    keys[queryName].sortKey = keyName;
  }

  return keys;
}

export const AmplifyFilter: React.FC<{
  children: React.ReactNodeArray | null;
  defaultQuery: string;
  setQuery: React.Dispatch<string> | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  filterValues: {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFilters: any;
}> = ({ children, defaultQuery, setQuery = null, ...propsRest }) => {
  if (!children) {
    throw new Error("AmplifyFilter has no children");
  }

  // First checks if children source props are well formatted
  const keys = getKeys(children);

  const { filterValues } = propsRest;

  // Determines which query will be executed depending on the filter
  let query = defaultQuery;
  if (Object.keys(filterValues).length === 1) {
    query = Object.keys(filterValues)[0];

    const filterHashKey = filterValues[query][keys[query].hashKey];

    // Case when filter values do not contain mandatory hash key
    if (!filterHashKey && propsRest.setFilters) {
      propsRest.setFilters({});
    }
  }

  // Tells the list component about the query in order to know which fields are sortable
  useEffect(() => {
    setQuery && setQuery(query);
  }, [query, setQuery]);

  function showFilter(queryName: string) {
    return query === defaultQuery || query === queryName;
  }

  // Checks if filter has a value
  function notBlank(filter: string) {
    return !!filter.split(".").reduce((o, i) => (!o ? o : o[i]), filterValues);
  }

  function renderInput(child: React.ReactNode) {
    const input = child as { props: { source: string } };

    const source = input.props.source;
    const sourceSplit = source.split(".");

    const queryName = sourceSplit[0];

    if (sourceSplit.length === 2) {
      return showFilter(queryName) && input;
    }

    const hashKeySource = `${queryName}.${keys[queryName].hashKey}`;

    return showFilter(queryName) && notBlank(hashKeySource) && input;
  }

  return <Filter {...propsRest}>{children.map(renderInput)}</Filter>;
};
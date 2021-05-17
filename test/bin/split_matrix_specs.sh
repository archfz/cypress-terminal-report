#!/bin/bash

# Calculate specs to run.
allSpecs=$(find specs/ -name "*.spec.js" | sort -n)
specCount=$(echo "$allSpecs" | wc -l)

CI_NODE_TOTAL=$CIRCLE_NODE_TOTAL
CI_NODE_INDEX=$((CIRCLE_NODE_INDEX + 1))

if [ "$CI_NODE_INDEX" == "" ]; then
  CY_SPECS=$(echo "$allSpecs" | paste -sd " " -)
else
  specPerRunner=$((specCount / CI_NODE_TOTAL))
  takeAmount="$specPerRunner"

  if [ "$CI_NODE_INDEX" == "$((CI_NODE_TOTAL))" ]; then
    takeAmount=$((specPerRunner * 2))
  fi

  specs=$(echo "$allSpecs" | tail -n +$((specPerRunner * (CI_NODE_INDEX - 1) + 1)) | head -$takeAmount )
  CY_SPECS=$(echo "$specs" | paste -sd " " -)
fi

echo $CY_SPECS

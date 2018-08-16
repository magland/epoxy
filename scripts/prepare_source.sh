#!/bin/bash

set -e

mkdir -p "${BUILD_DIR}/source"

if [[ "${SOURCE_DIR_OR_URL}" == http:* ]] || [[ "${SOURCE_DIR_OR_URL}" == https:* ]] ;
then
	git clone "${SOURCE_DIR_OR_URL}" "${BUILD_DIR}"/source
else
	cp -r "${SOURCE_DIR_OR_URL}"/* "${BUILD_DIR}"/source/
fi




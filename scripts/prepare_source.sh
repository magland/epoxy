#!/bin/bash

set -e

mkdir -p "${BUILD_DIR}/source"

if [[ "${SOURCE_DIR_OR_URL}" == http:* ]] || [[ "${SOURCE_DIR_OR_URL}" == https:* ]] ;
then
	git clone "${SOURCE_DIR_OR_URL}" "${BUILD_DIR}"/source
else
	cp -r "${SOURCE_DIR_OR_URL}"/* "${BUILD_DIR}"/source/
fi

if [ -f "${BUILD_DIR}/source/environment.yml" ]; then
	cp "${BUILD_DIR}"/source/environment.yml "${BUILD_DIR}"/environment.yml
else
	cp "${TEMPLATE_DIR}"/default_environment.yml "${BUILD_DIR}"/environment.yml
fi

if [ -f "${BUILD_DIR}/source/postBuild" ]; then
	cp "${BUILD_DIR}"/source/postBuild "${BUILD_DIR}"/postBuild
else
	cp "${TEMPLATE_DIR}"/default_postBuild "${BUILD_DIR}"/postBuild
fi



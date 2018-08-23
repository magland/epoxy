#!/bin/bash

set -e

if [[ "${SOURCE_DIR_OR_URL}" == http:* ]] || [[ "${SOURCE_DIR_OR_URL}" == https:* ]] ;
then
	git clone "${SOURCE_DIR_OR_URL}" "${BUILD_DIR}"/source
fi

if [ -f "${SOURCE_DIRECTORY}/environment.yml" ]; then
	cp "${SOURCE_DIRECTORY}"/environment.yml "${BUILD_DIR}"/environment.yml
else
	cp "${TEMPLATE_DIR}"/default_environment.yml "${BUILD_DIR}"/environment.yml
fi

if [ -f "${SOURCE_DIRECTORY}/postBuild" ]; then
	cp "${SOURCE_DIRECTORY}"/postBuild "${BUILD_DIR}"/postBuild
else
	cp "${TEMPLATE_DIR}"/default_postBuild "${BUILD_DIR}"/postBuild
fi



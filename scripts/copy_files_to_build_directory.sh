#!/bin/bash

set -e

if [[ "${EPOXY_CAPSULE_MODE}" == "true" ]]; then
	cp "${SOURCE_DIRECTORY}"/environment/* "${BUILD_DIR}"/ #note we are in trouble if environment/source exists in the capsule

	echo "" >> "${BUILD_DIR}"/Dockerfile
	echo "##### Added by epoxy:" >> "${BUILD_DIR}"/Dockerfile
	echo "ADD epoxy.sh /epoxy/epoxy.sh" >> "${BUILD_DIR}"/Dockerfile
	echo "RUN bash /epoxy/epoxy.sh" >> "${BUILD_DIR}"/Dockerfile
	echo "ADD source /workspace" >> "${BUILD_DIR}"/Dockerfile
	echo "WORKDIR /workspace" >> "${BUILD_DIR}"/Dockerfile
	echo "#####################:" >> "${BUILD_DIR}"/Dockerfile

	echo "set -e" >> "${BUILD_DIR}"/epoxy.sh

	mkdir -p "${BUILD_DIR}"/workspace/results ## the capsule may not have a results directory, but it needs one
else
	cp -r "${TEMPLATE_DIR}"/* "${BUILD_DIR}"/
fi

if [[ "${EPOXY_INSTALL_JUPYTERLAB}" == "true" ]]; then
		echo "conda install jupyterlab" >> "${BUILD_DIR}"/epoxy.sh
fi
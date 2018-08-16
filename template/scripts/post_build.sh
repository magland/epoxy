#!/bin/bash

set -e

if [ -e postBuild ]
then
	echo "Running postBuild"
	bash postBuild
fi

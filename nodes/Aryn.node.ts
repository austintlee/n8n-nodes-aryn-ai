import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IRequestOptions,
	NodeConnectionType,
	IDataObject,
} from 'n8n-workflow';


export class Aryn implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		displayName: 'Aryn',
		name: 'aryn',
		icon: 'file:ArynCircleLogo.svg',
		group: ['transform'],
		version: 0,
		subtitle: '={{ $parameter["operation"] }}',
		description: 'Consume Aryn API',
		defaults: {
			name: 'Aryn',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'arynApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.aryn.ai',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Parse Document',
						value: 'parse',
						description: 'Parse a document into structured data',
						action: 'Parse a document',
					},
				],
				default: 'parse',
				noDataExpression: true,
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				placeholder: 'e.g data',
				hint: 'The name of the input binary field containing the file to be extracted',
	},
		]
	};
	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// Handle data coming from previous nodes
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;
		let responseData;

		// For each item, make an API call to create a contact
		for (let i = 0; i < items.length; i++) {
			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
			const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

			if (operation === 'parse') {

				const body: IDataObject = {
					files: {
						pdf: binaryData.data,
					}
				};
				// Make HTTP request
				const options: IRequestOptions = {
					headers: {
						'Accept': 'application/json',
					},
					method: 'POST',
					body: body,
					uri: `https://api.aryn.ai/v1/document/partition`,
					json: true,
				};
				responseData = await this.helpers.requestWithAuthentication.call(this, 'arynApi', options);
				returnData.push(responseData);
			}
		}
		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(returnData)];
	}
}
